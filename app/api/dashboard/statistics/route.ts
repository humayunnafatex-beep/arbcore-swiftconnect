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

    const channelsPromise = safeMetricGroup("channels", warnings, async () => {
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

    const messageHealthPromise = safeMetricGroup("messageHealth", warnings, async () => {
      const [messagesSentToday, totalMessages, statusGroups, channelGroups, directionGroups] = await Promise.all([
        prisma.messageLog.count({
          where: {
            companyId,
            direction: "OUTBOUND",
            createdAt: { gte: today },
            status: { in: ["SENT", "DELIVERED", "READ"] }
          }
        }),
        prisma.messageLog.count({ where: { companyId } }),
        prisma.messageLog.groupBy({
          by: ["status"],
          where: { companyId },
          _count: { _all: true }
        }),
        prisma.messageLog.groupBy({
          by: ["channel"],
          where: { companyId },
          _count: { _all: true }
        }),
        prisma.messageLog.groupBy({
          by: ["direction"],
          where: { companyId },
          _count: { _all: true }
        })
      ]);
      const countByStatus = new Map(statusGroups.map((group) => [group.status, group._count._all]));
      const countByChannel = new Map(channelGroups.map((group) => [group.channel, group._count._all]));
      const countByDirection = new Map(directionGroups.map((group) => [group.direction, group._count._all]));

      return {
        messagesSentToday,
        totalMessages,
        failedMessages: countByStatus.get("FAILED") ?? 0,
        sentMessages: (countByStatus.get("SENT") ?? 0) + (countByStatus.get("DELIVERED") ?? 0) + (countByStatus.get("READ") ?? 0),
        receivedMessages: countByStatus.get("RECEIVED") ?? 0,
        attemptedMessages: countByStatus.get("QUEUED") ?? 0,
        whatsappMessages: countByChannel.get("WHATSAPP") ?? 0,
        messengerMessages: countByChannel.get("MESSENGER") ?? 0,
        inboundMessages: countByDirection.get("INBOUND") ?? 0,
        outboundMessages: countByDirection.get("OUTBOUND") ?? 0
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

    const inboxPromise = safeMetricGroup("inbox", warnings, async () => {
      const [
        stateGroups,
        unassignedConversations,
        dueFollowUps,
        upcomingFollowUps,
        doneFollowUps
      ] = await Promise.all([
        prisma.conversationState.groupBy({
          by: ["status"],
          where: { companyId },
          _count: { _all: true }
        }),
        prisma.conversationState.count({ where: { companyId, assignedToId: null } }),
        prisma.conversationState.count({ where: { companyId, followUpAt: { lte: new Date() }, followUpDone: false } }),
        prisma.conversationState.count({ where: { companyId, followUpAt: { gt: new Date() }, followUpDone: false } }),
        prisma.conversationState.count({ where: { companyId, followUpDone: true } })
      ]);
      const countByStatus = new Map(stateGroups.map((group) => [group.status, group._count._all]));

      return {
        openConversations: countByStatus.get("OPEN") ?? 0,
        pendingConversations: countByStatus.get("PENDING") ?? 0,
        closedConversations: countByStatus.get("CLOSED") ?? 0,
        unassignedConversations,
        dueFollowUps,
        upcomingFollowUps,
        doneFollowUps
      };
    }, {
      openConversations: 0,
      pendingConversations: 0,
      closedConversations: 0,
      unassignedConversations: 0,
      dueFollowUps: 0,
      upcomingFollowUps: 0,
      doneFollowUps: 0
    });

    const campaignsPromise = safeMetricGroup("campaigns", warnings, async () => {
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

    const contactsPromise = safeMetricGroup("contacts", warnings, async () => {
      const [contactCount, activeContacts, stageGroups] = await Promise.all([
        prisma.contact.count({ where: { companyId } }),
        prisma.contact.count({ where: { companyId, doNotContact: false, optedIn: true } }),
        prisma.contact.groupBy({
          by: ["stage"],
          where: { companyId },
          _count: { _all: true }
        })
      ]);
      const countByStage = new Map(stageGroups.map((group) => [group.stage, group._count._all]));
      const newLeads = countByStage.get("NEW_LEAD") ?? 0;
      const interestedLeads = countByStage.get("INTERESTED") ?? 0;
      const followUpContacts = countByStage.get("FOLLOW_UP") ?? 0;
      const orderedContacts =
        (countByStage.get("ORDERED") ?? 0) +
        (countByStage.get("DELIVERED") ?? 0) +
        (countByStage.get("WON") ?? 0);

      return {
        contacts: contactCount,
        totalContacts: contactCount,
        hotLeads: newLeads + interestedLeads + followUpContacts,
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

    const autoReplyPromise = safeMetricGroup("autoReplyAnalytics", warnings, async () => {
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

    const ordersPromise = safeMetricGroup("orders", warnings, async () => {
      const [
        orderStatusGroups,
        paymentStatusGroups,
        dueOrderFollowUps,
        upcomingOrderFollowUps,
        doneOrderFollowUps,
        totalOrderValue
      ] = await Promise.all([
        prisma.order.groupBy({
          by: ["orderStatus"],
          where: { companyId },
          _count: { _all: true }
        }),
        prisma.order.groupBy({
          by: ["paymentStatus"],
          where: { companyId },
          _count: { _all: true }
        }),
        prisma.order.count({ where: { companyId, followUpAt: { lte: new Date() }, followUpDone: false } }),
        prisma.order.count({ where: { companyId, followUpAt: { gt: new Date() }, followUpDone: false } }),
        prisma.order.count({ where: { companyId, followUpDone: true } }),
        prisma.order.aggregate({
          where: { companyId, orderStatus: { in: ["CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"] } },
          _sum: { totalAmount: true }
        })
      ]);
      const countByOrderStatus = new Map(orderStatusGroups.map((group) => [group.orderStatus, group._count._all]));
      const countByPaymentStatus = new Map(paymentStatusGroups.map((group) => [group.paymentStatus, group._count._all]));

      return {
        draftOrders: countByOrderStatus.get("DRAFT") ?? 0,
        confirmedOrders: countByOrderStatus.get("CONFIRMED") ?? 0,
        packedOrders: countByOrderStatus.get("PACKED") ?? 0,
        shippedOrders: countByOrderStatus.get("SHIPPED") ?? 0,
        deliveredOrders: countByOrderStatus.get("DELIVERED") ?? 0,
        cancelledOrders: countByOrderStatus.get("CANCELLED") ?? 0,
        dueOrderFollowUps,
        upcomingOrderFollowUps,
        doneOrderFollowUps,
        unpaidOrders: countByPaymentStatus.get("UNPAID") ?? 0,
        codOrders: countByPaymentStatus.get("COD") ?? 0,
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

    const productsPromise = safeMetricGroup("products", warnings, async () => {
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

    const billingPromise = safeMetricGroup("billing", warnings, async () => {
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
            contacts: 0,
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
          contacts: 0,
          contactsLimit: getPlanLimits(normalizePlanName(company.plan)).contacts,
          monthlyMessages: 0,
          monthlyMessagesLimit: getPlanLimits(normalizePlanName(company.plan)).monthlyMessages,
          enabledChannelCount: 0
        }
      }
    });

    const workspacePromise = safeMetricGroup("workspace", warnings, async () => {
      const [teamMembers, aiCreditsUsed] = await Promise.all([
        prisma.user.count({ where: { companyId, isActive: true } }),
        prisma.aiGeneration.count({ where: { companyId } })
      ]);

      return { teamMembers, aiCreditsUsed };
    }, {
      teamMembers: 0,
      aiCreditsUsed: 0
    });

    const [
      channels,
      messageHealth,
      inbox,
      campaigns,
      contacts,
      autoReply,
      orders,
      products,
      billing,
      workspace
    ] = await Promise.all([
      channelsPromise,
      messageHealthPromise,
      inboxPromise,
      campaignsPromise,
      contactsPromise,
      autoReplyPromise,
      ordersPromise,
      productsPromise,
      billingPromise,
      workspacePromise
    ]);
    const dashboardBilling = {
      ...billing.billing,
      usage: {
        ...billing.billing.usage,
        contacts: contacts.contacts
      }
    };

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
      billing: dashboardBilling,
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

function audienceCriteriaWhere() {
  return [
    { audienceStatus: { not: "" } },
    { audienceTags: { not: "" } },
    { audienceSearch: { not: "" } },
    { audienceChannel: { not: "" } },
    { audienceLimit: { not: null } }
  ];
}
