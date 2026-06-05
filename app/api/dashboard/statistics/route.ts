import { handleApiError, ok } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { getPlanLimits, normalizePlanName } from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma";
import { sanitizeLogMetadata } from "@/lib/safe-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DashboardWarning = {
  module: string;
  message: string;
};

type ConversationStateMetric = {
  channel: string;
  contactKey: string;
  status: string;
  assignedToId: string | null;
  followUpAt: Date | null;
  followUpDone: boolean;
};

type ConversationMessageMetric = {
  channel: string;
  providerMessageId: string | null;
  contact: { phone: string } | null;
  whatsappAccount: { phoneNumber: string } | null;
};

const optionalMetricMessage = "Metrics are temporarily unavailable. Production migrations may be pending.";

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const { context } = await requirePermission("dashboard.view");
    const { company } = context;
    const companyId = company.id;
    const warnings: DashboardWarning[] = [];

    const channels = await safeMetricGroup("channels", warnings, async () => {
      const [connectedNumbers] = await Promise.all([
        prisma.whatsAppAccount.count({ where: { companyId, status: "CONNECTED" } })
      ]);

      return {
        connectedNumbers,
        whatsappConfigured: Boolean(company.whatsappPhoneNumberId && company.whatsappAccessToken),
        messengerConfigured: Boolean(company.messengerPageAccessToken)
      };
    }, {
      connectedNumbers: 0,
      whatsappConfigured: Boolean(company.whatsappPhoneNumberId && company.whatsappAccessToken),
      messengerConfigured: Boolean(company.messengerPageAccessToken)
    });

    const messageHealth = await safeMetricGroup("messageHealth", warnings, async () => {
      const [
        messagesSentToday,
        totalMessages,
        failedMessages,
        sentMessages,
        receivedMessages,
        attemptedMessages,
        whatsappMessages,
        messengerMessages,
        inboundMessages,
        outboundMessages
      ] = await Promise.all([
        prisma.messageLog.count({
          where: {
            companyId,
            direction: "OUTBOUND",
            createdAt: { gte: today },
            status: { in: ["SENT", "DELIVERED", "READ"] }
          }
        }),
        prisma.messageLog.count({ where: { companyId } }),
        prisma.messageLog.count({ where: { companyId, status: "FAILED" } }),
        prisma.messageLog.count({ where: { companyId, status: { in: ["SENT", "DELIVERED", "READ"] } } }),
        prisma.messageLog.count({ where: { companyId, status: "RECEIVED" } }),
        prisma.messageLog.count({ where: { companyId, status: "QUEUED" } }),
        prisma.messageLog.count({ where: { companyId, channel: "WHATSAPP" } }),
        prisma.messageLog.count({ where: { companyId, channel: "MESSENGER" } }),
        prisma.messageLog.count({ where: { companyId, direction: "INBOUND" } }),
        prisma.messageLog.count({ where: { companyId, direction: "OUTBOUND" } })
      ]);

      return {
        messagesSentToday,
        totalMessages,
        failedMessages,
        sentMessages,
        receivedMessages,
        attemptedMessages,
        whatsappMessages,
        messengerMessages,
        inboundMessages,
        outboundMessages
      };
    }, {
      messagesSentToday: 0,
      totalMessages: 0,
      failedMessages: 0,
      sentMessages: 0,
      receivedMessages: 0,
      attemptedMessages: 0,
      whatsappMessages: 0,
      messengerMessages: 0,
      inboundMessages: 0,
      outboundMessages: 0
    });

    const inbox = await safeMetricGroup("inbox", warnings, async () => {
      const [conversationStates, conversationMessages] = await Promise.all([
        prisma.conversationState.findMany({
          where: { companyId },
          select: {
            channel: true,
            contactKey: true,
            status: true,
            assignedToId: true,
            followUpAt: true,
            followUpDone: true
          }
        }),
        prisma.messageLog.findMany({
          where: { companyId, channel: { in: ["WHATSAPP", "MESSENGER"] } },
          select: {
            channel: true,
            providerMessageId: true,
            contact: { select: { phone: true } },
            whatsappAccount: { select: { phoneNumber: true } }
          }
        })
      ]);

      return getInboxMetrics(conversationStates, conversationMessages);
    }, {
      openConversations: 0,
      pendingConversations: 0,
      closedConversations: 0,
      unassignedConversations: 0,
      dueFollowUps: 0,
      upcomingFollowUps: 0,
      doneFollowUps: 0
    });

    const campaigns = await safeMetricGroup("campaigns", warnings, async () => {
      const [
        activeCampaigns,
        draftCampaigns,
        readyCampaigns,
        campaignsWithAudienceCriteria,
        readyCampaignsWithAudience,
        totalCampaigns
      ] = await Promise.all([
        prisma.campaign.count({ where: { companyId, status: { in: ["READY", "PAUSED"] } } }),
        prisma.campaign.count({ where: { companyId, status: "DRAFT" } }),
        prisma.campaign.count({ where: { companyId, status: "READY" } }),
        prisma.campaign.count({ where: { companyId, OR: audienceCriteriaWhere() } }),
        prisma.campaign.count({ where: { companyId, status: "READY", OR: audienceCriteriaWhere() } }),
        prisma.campaign.count({ where: { companyId } })
      ]);

      return {
        activeCampaigns,
        draftCampaigns,
        readyCampaigns,
        campaignsWithAudienceCriteria,
        readyCampaignsWithAudience,
        totalCampaigns
      };
    }, {
      activeCampaigns: 0,
      draftCampaigns: 0,
      readyCampaigns: 0,
      campaignsWithAudienceCriteria: 0,
      readyCampaignsWithAudience: 0,
      totalCampaigns: 0
    });

    const contacts = await safeMetricGroup("contacts", warnings, async () => {
      const [
        contactCount,
        hotLeads,
        activeContacts,
        newLeads,
        interestedLeads,
        orderedContacts,
        followUpContacts
      ] = await Promise.all([
        prisma.contact.count({ where: { companyId } }),
        prisma.contact.count({ where: { companyId, stage: { in: ["NEW_LEAD", "INTERESTED", "FOLLOW_UP"] } } }),
        prisma.contact.count({ where: { companyId, doNotContact: false, optedIn: true } }),
        prisma.contact.count({ where: { companyId, stage: "NEW_LEAD" } }),
        prisma.contact.count({ where: { companyId, stage: "INTERESTED" } }),
        prisma.contact.count({ where: { companyId, stage: { in: ["ORDERED", "DELIVERED", "WON"] } } }),
        prisma.contact.count({ where: { companyId, stage: "FOLLOW_UP" } })
      ]);

      return {
        contacts: contactCount,
        totalContacts: contactCount,
        hotLeads,
        activeContacts,
        newLeads,
        interestedLeads,
        orderedContacts,
        followUpContacts
      };
    }, {
      contacts: 0,
      totalContacts: 0,
      hotLeads: 0,
      activeContacts: 0,
      newLeads: 0,
      interestedLeads: 0,
      orderedContacts: 0,
      followUpContacts: 0
    });

    const autoReply = await safeMetricGroup("autoReplyAnalytics", warnings, async () => {
      const [activeAutoReplyRules, autoReplyAttempted30d, autoReplySent30d, autoReplyFailed30d] = await Promise.all([
        prisma.autoReplyRule.count({ where: { companyId, isActive: true } }),
        prisma.autoReplyEvent.count({ where: { companyId, createdAt: { gte: thirtyDaysAgo } } }),
        prisma.autoReplyEvent.count({ where: { companyId, createdAt: { gte: thirtyDaysAgo }, status: "SENT" } }),
        prisma.autoReplyEvent.count({ where: { companyId, createdAt: { gte: thirtyDaysAgo }, status: "FAILED" } })
      ]);

      return {
        activeAutoReplyRules,
        autoReplyAttempted30d,
        autoReplySent30d,
        autoReplyFailed30d,
        autoReplySuccessRate30d: autoReplyAttempted30d ? Math.round((autoReplySent30d / autoReplyAttempted30d) * 100) : 0
      };
    }, {
      activeAutoReplyRules: 0,
      autoReplyAttempted30d: 0,
      autoReplySent30d: 0,
      autoReplyFailed30d: 0,
      autoReplySuccessRate30d: 0
    });

    const orders = await safeMetricGroup("orders", warnings, async () => {
      const [
        draftOrders,
        confirmedOrders,
        packedOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        dueOrderFollowUps,
        upcomingOrderFollowUps,
        doneOrderFollowUps,
        unpaidOrders,
        codOrders,
        totalOrderValue
      ] = await Promise.all([
        prisma.order.count({ where: { companyId, orderStatus: "DRAFT" } }),
        prisma.order.count({ where: { companyId, orderStatus: "CONFIRMED" } }),
        prisma.order.count({ where: { companyId, orderStatus: "PACKED" } }),
        prisma.order.count({ where: { companyId, orderStatus: "SHIPPED" } }),
        prisma.order.count({ where: { companyId, orderStatus: "DELIVERED" } }),
        prisma.order.count({ where: { companyId, orderStatus: "CANCELLED" } }),
        prisma.order.count({ where: { companyId, followUpAt: { lte: new Date() }, followUpDone: false } }),
        prisma.order.count({ where: { companyId, followUpAt: { gt: new Date() }, followUpDone: false } }),
        prisma.order.count({ where: { companyId, followUpDone: true } }),
        prisma.order.count({ where: { companyId, paymentStatus: "UNPAID" } }),
        prisma.order.count({ where: { companyId, paymentStatus: "COD" } }),
        prisma.order.aggregate({
          where: { companyId, orderStatus: { in: ["CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"] } },
          _sum: { totalAmount: true }
        })
      ]);

      return {
        draftOrders,
        confirmedOrders,
        packedOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        dueOrderFollowUps,
        upcomingOrderFollowUps,
        doneOrderFollowUps,
        unpaidOrders,
        codOrders,
        totalOrderValue: totalOrderValue._sum.totalAmount ?? 0
      };
    }, {
      draftOrders: 0,
      confirmedOrders: 0,
      packedOrders: 0,
      shippedOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
      dueOrderFollowUps: 0,
      upcomingOrderFollowUps: 0,
      doneOrderFollowUps: 0,
      unpaidOrders: 0,
      codOrders: 0,
      totalOrderValue: 0
    });

    const products = await safeMetricGroup("products", warnings, async () => {
      const [activeProducts, draftProducts, archivedProducts, productsWithStockNote] = await Promise.all([
        prisma.product.count({ where: { companyId, status: "ACTIVE" } }),
        prisma.product.count({ where: { companyId, status: "DRAFT" } }),
        prisma.product.count({ where: { companyId, status: "ARCHIVED" } }),
        prisma.product.count({ where: { companyId, stockNote: { not: "" } } })
      ]);

      return { activeProducts, draftProducts, archivedProducts, productsWithStockNote };
    }, {
      activeProducts: 0,
      draftProducts: 0,
      archivedProducts: 0,
      productsWithStockNote: 0
    });

    const billing = await safeMetricGroup("billing", warnings, async () => {
      const [subscription, paymentGroups, lastPayment, monthlyMessagesForPlan] = await Promise.all([
        prisma.subscription.findFirst({ where: { companyId }, orderBy: { createdAt: "desc" } }),
        prisma.paymentRecord.groupBy({
          by: ["status"],
          where: { companyId },
          _sum: { amount: true },
          _count: { _all: true }
        }),
        prisma.paymentRecord.findFirst({
          where: { companyId },
          orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }]
        }),
        prisma.messageLog.count({
          where: { companyId, createdAt: { gte: new Date(today.getFullYear(), today.getMonth(), 1) } }
        })
      ]);
      const pendingPayments = paymentGroups.find((group) => group.status === "PENDING");
      const plan = normalizePlanName(subscription?.plan || company.plan);
      const limits = getPlanLimits(plan);
      const enabledChannelCount = [
        company.whatsappPhoneNumberId && company.whatsappAccessToken,
        company.messengerPageId && company.messengerPageAccessToken
      ].filter(Boolean).length;

      return {
        billing: {
          plan,
          status: subscription?.status || "ACTIVE",
          pendingPaymentCount: pendingPayments?._count._all ?? 0,
          pendingPaymentAmount: pendingPayments?._sum.amount ?? 0,
          lastPaymentDate: (lastPayment?.paidAt ?? lastPayment?.createdAt)?.toISOString() ?? null,
          lastPaymentAmount: lastPayment?.amount ?? null,
          currency: lastPayment?.currency || "BDT",
          usage: {
            contacts: contacts.contacts,
            contactsLimit: limits.contacts,
            monthlyMessages: monthlyMessagesForPlan,
            monthlyMessagesLimit: limits.monthlyMessages,
            enabledChannelCount
          }
        }
      };
    }, {
      billing: {
        plan: normalizePlanName(company.plan),
        status: "ACTIVE",
        pendingPaymentCount: 0,
        pendingPaymentAmount: 0,
        lastPaymentDate: null,
        lastPaymentAmount: null,
        currency: "BDT",
        usage: {
          contacts: contacts.contacts,
          contactsLimit: getPlanLimits(normalizePlanName(company.plan)).contacts,
          monthlyMessages: 0,
          monthlyMessagesLimit: getPlanLimits(normalizePlanName(company.plan)).monthlyMessages,
          enabledChannelCount: 0
        }
      }
    });

    const workspace = await safeMetricGroup("workspace", warnings, async () => {
      const [teamMembers, aiCreditsUsed] = await Promise.all([
        prisma.user.count({ where: { companyId, isActive: true } }),
        prisma.aiGeneration.count({ where: { companyId } })
      ]);

      return { teamMembers, aiCreditsUsed };
    }, {
      teamMembers: 0,
      aiCreditsUsed: 0
    });

    return ok({
      ...channels,
      ...messageHealth,
      ...inbox,
      ...campaigns,
      ...contacts,
      ...autoReply,
      ...orders,
      ...products,
      ...workspace,
      ...billing,
      warnings,
      apiStatus: warnings.length ? "Degraded" : "Operational"
    });
  } catch (error) {
    return handleApiError(error);
  }
}

async function safeMetricGroup<T>(
  module: string,
  warnings: DashboardWarning[],
  load: () => Promise<T>,
  fallback: T
) {
  try {
    return await load();
  } catch (error) {
    console.error(`Dashboard ${module} metrics failed:`, sanitizeLogMetadata(error));
    warnings.push({
      module,
      message: optionalMetricMessage
    });
    return fallback;
  }
}

function getInboxMetrics(
  conversationStates: ConversationStateMetric[],
  conversationMessages: ConversationMessageMetric[]
) {
  const stateByConversation = new Map(conversationStates.map((state) => [`${state.channel}:${state.contactKey}`, state]));
  const conversationKeys = new Set<string>();

  for (const message of conversationMessages) {
    const channel = message.channel === "MESSENGER" ? "MESSENGER" : "WHATSAPP";
    const contactKey = message.contact?.phone ?? message.whatsappAccount?.phoneNumber ?? message.providerMessageId ?? "unknown";
    conversationKeys.add(`${channel}:${contactKey}`);
  }

  const defaultOpenConversations = Array.from(conversationKeys).filter((key) => !stateByConversation.has(key)).length;

  return {
    openConversations: conversationStates.filter((state) => state.status === "OPEN").length + defaultOpenConversations,
    pendingConversations: conversationStates.filter((state) => state.status === "PENDING").length,
    closedConversations: conversationStates.filter((state) => state.status === "CLOSED").length,
    unassignedConversations: conversationStates.filter((state) => !state.assignedToId).length + defaultOpenConversations,
    dueFollowUps: conversationStates.filter((state) => state.followUpAt && !state.followUpDone && state.followUpAt.getTime() <= Date.now()).length,
    upcomingFollowUps: conversationStates.filter((state) => state.followUpAt && !state.followUpDone && state.followUpAt.getTime() > Date.now()).length,
    doneFollowUps: conversationStates.filter((state) => state.followUpDone).length
  };
}

function audienceCriteriaWhere() {
  return [
    { audienceStatus: { not: "" } },
    { audienceTags: { not: "" } },
    { audienceSearch: { not: "" } },
    { audienceChannel: { not: "" } },
    { audienceLimit: { not: null } }
  ];
}
