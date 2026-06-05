import { handleApiError, ok } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { getPlanLimits, normalizePlanName } from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const { context } = await requirePermission("dashboard.view");
    const { company } = context;
    const companyId = company.id;

    const [
      connectedNumbers,
      messagesSentToday,
      totalMessages,
      conversationStates,
      conversationMessages,
      failedMessages,
      sentMessages,
      receivedMessages,
      attemptedMessages,
      whatsappMessages,
      messengerMessages,
      inboundMessages,
      outboundMessages,
      activeCampaigns,
      draftCampaigns,
      readyCampaigns,
      campaignsWithAudienceCriteria,
      readyCampaignsWithAudience,
      totalCampaigns,
      contacts,
      hotLeads,
      activeContacts,
      newLeads,
      interestedLeads,
      orderedContacts,
      followUpContacts,
      activeAutoReplyRules,
      teamMembers,
      aiCreditsUsed,
      subscription,
      paymentGroups,
      lastPayment,
      monthlyMessagesForPlan,
      autoReplyAttempted30d,
      autoReplySent30d,
      autoReplyFailed30d,
      draftOrders,
      confirmedOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      unpaidOrders,
      codOrders,
      totalOrderValue
    ] = await Promise.all([
      prisma.whatsAppAccount.count({ where: { companyId, status: "CONNECTED" } }),
      prisma.messageLog.count({
        where: {
          companyId,
          direction: "OUTBOUND",
          createdAt: { gte: today },
          status: { in: ["SENT", "DELIVERED", "READ"] }
        }
      }),
      prisma.messageLog.count({ where: { companyId } }),
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
      }),
      prisma.messageLog.count({ where: { companyId, status: "FAILED" } }),
      prisma.messageLog.count({ where: { companyId, status: { in: ["SENT", "DELIVERED", "READ"] } } }),
      prisma.messageLog.count({ where: { companyId, status: "RECEIVED" } }),
      prisma.messageLog.count({ where: { companyId, status: "QUEUED" } }),
      prisma.messageLog.count({ where: { companyId, channel: "WHATSAPP" } }),
      prisma.messageLog.count({ where: { companyId, channel: "MESSENGER" } }),
      prisma.messageLog.count({ where: { companyId, direction: "INBOUND" } }),
      prisma.messageLog.count({ where: { companyId, direction: "OUTBOUND" } }),
      prisma.campaign.count({ where: { companyId, status: { in: ["READY", "PAUSED"] } } }),
      prisma.campaign.count({ where: { companyId, status: "DRAFT" } }),
      prisma.campaign.count({ where: { companyId, status: "READY" } }),
      prisma.campaign.count({
        where: {
          companyId,
          OR: [
            { audienceStatus: { not: "" } },
            { audienceTags: { not: "" } },
            { audienceSearch: { not: "" } },
            { audienceChannel: { not: "" } },
            { audienceLimit: { not: null } }
          ]
        }
      }),
      prisma.campaign.count({
        where: {
          companyId,
          status: "READY",
          OR: [
            { audienceStatus: { not: "" } },
            { audienceTags: { not: "" } },
            { audienceSearch: { not: "" } },
            { audienceChannel: { not: "" } },
            { audienceLimit: { not: null } }
          ]
        }
      }),
      prisma.campaign.count({ where: { companyId } }),
      prisma.contact.count({ where: { companyId } }),
      prisma.contact.count({ where: { companyId, stage: { in: ["NEW_LEAD", "INTERESTED", "FOLLOW_UP"] } } }),
      prisma.contact.count({ where: { companyId, doNotContact: false, optedIn: true } }),
      prisma.contact.count({ where: { companyId, stage: "NEW_LEAD" } }),
      prisma.contact.count({ where: { companyId, stage: "INTERESTED" } }),
      prisma.contact.count({ where: { companyId, stage: { in: ["ORDERED", "DELIVERED", "WON"] } } }),
      prisma.contact.count({ where: { companyId, stage: "FOLLOW_UP" } }),
      prisma.autoReplyRule.count({ where: { companyId, isActive: true } }),
      prisma.user.count({ where: { companyId, isActive: true } }),
      prisma.aiGeneration.count({ where: { companyId } }),
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
      }),
      prisma.autoReplyEvent.count({ where: { companyId, createdAt: { gte: thirtyDaysAgo } } }),
      prisma.autoReplyEvent.count({ where: { companyId, createdAt: { gte: thirtyDaysAgo }, status: "SENT" } }),
      prisma.autoReplyEvent.count({ where: { companyId, createdAt: { gte: thirtyDaysAgo }, status: "FAILED" } }),
      prisma.order.count({ where: { companyId, orderStatus: "DRAFT" } }),
      prisma.order.count({ where: { companyId, orderStatus: "CONFIRMED" } }),
      prisma.order.count({ where: { companyId, orderStatus: "SHIPPED" } }),
      prisma.order.count({ where: { companyId, orderStatus: "DELIVERED" } }),
      prisma.order.count({ where: { companyId, orderStatus: "CANCELLED" } }),
      prisma.order.count({ where: { companyId, paymentStatus: "UNPAID" } }),
      prisma.order.count({ where: { companyId, paymentStatus: "COD" } }),
      prisma.order.aggregate({
        where: { companyId, orderStatus: { in: ["CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"] } },
        _sum: { totalAmount: true }
      })
    ]);
    const stateByConversation = new Map(conversationStates.map((state) => [`${state.channel}:${state.contactKey}`, state]));
    const conversationKeys = new Set<string>();

    for (const message of conversationMessages) {
      const channel = message.channel === "MESSENGER" ? "MESSENGER" : "WHATSAPP";
      const contactKey = message.contact?.phone ?? message.whatsappAccount?.phoneNumber ?? message.providerMessageId ?? "unknown";
      conversationKeys.add(`${channel}:${contactKey}`);
    }

    const defaultOpenConversations = Array.from(conversationKeys).filter((key) => !stateByConversation.has(key)).length;
    const openConversations = conversationStates.filter((state) => state.status === "OPEN").length + defaultOpenConversations;
    const pendingConversations = conversationStates.filter((state) => state.status === "PENDING").length;
    const closedConversations = conversationStates.filter((state) => state.status === "CLOSED").length;
    const unassignedConversations = conversationStates.filter((state) => !state.assignedToId).length + defaultOpenConversations;
    const dueFollowUps = conversationStates.filter((state) => state.followUpAt && !state.followUpDone && state.followUpAt.getTime() <= Date.now()).length;
    const upcomingFollowUps = conversationStates.filter((state) => state.followUpAt && !state.followUpDone && state.followUpAt.getTime() > Date.now()).length;
    const doneFollowUps = conversationStates.filter((state) => state.followUpDone).length;
    const pendingPayments = paymentGroups.find((group) => group.status === "PENDING");
    const plan = normalizePlanName(subscription?.plan || company.plan);
    const limits = getPlanLimits(plan);
    const enabledChannelCount = [
      company.whatsappPhoneNumberId && company.whatsappAccessToken,
      company.messengerPageId && company.messengerPageAccessToken
    ].filter(Boolean).length;

    return ok({
      connectedNumbers,
      messagesSentToday,
      totalMessages,
      openConversations,
      pendingConversations,
      closedConversations,
      unassignedConversations,
      dueFollowUps,
      upcomingFollowUps,
      doneFollowUps,
      failedMessages,
      sentMessages,
      receivedMessages,
      attemptedMessages,
      whatsappMessages,
      messengerMessages,
      inboundMessages,
      outboundMessages,
      activeCampaigns,
      draftCampaigns,
      readyCampaigns,
      campaignsWithAudienceCriteria,
      readyCampaignsWithAudience,
      totalCampaigns,
      contacts,
      totalContacts: contacts,
      hotLeads,
      activeContacts,
      newLeads,
      interestedLeads,
      orderedContacts,
      followUpContacts,
      activeAutoReplyRules,
      autoReplyAttempted30d,
      autoReplySent30d,
      autoReplyFailed30d,
      autoReplySuccessRate30d: autoReplyAttempted30d ? Math.round((autoReplySent30d / autoReplyAttempted30d) * 100) : 0,
      draftOrders,
      confirmedOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      unpaidOrders,
      codOrders,
      totalOrderValue: totalOrderValue._sum.totalAmount ?? 0,
      teamMembers,
      aiCreditsUsed,
      whatsappConfigured: Boolean(company.whatsappPhoneNumberId && company.whatsappAccessToken),
      messengerConfigured: Boolean(company.messengerPageAccessToken),
      billing: {
        plan,
        status: subscription?.status || "ACTIVE",
        pendingPaymentCount: pendingPayments?._count._all ?? 0,
        pendingPaymentAmount: pendingPayments?._sum.amount ?? 0,
        lastPaymentDate: (lastPayment?.paidAt ?? lastPayment?.createdAt)?.toISOString() ?? null,
        lastPaymentAmount: lastPayment?.amount ?? null,
        currency: lastPayment?.currency || "BDT",
        usage: {
          contacts,
          contactsLimit: limits.contacts,
          monthlyMessages: monthlyMessagesForPlan,
          monthlyMessagesLimit: limits.monthlyMessages,
          enabledChannelCount
        }
      },
      apiStatus: "Operational"
    });
  } catch (error) {
    return handleApiError(error);
  }
}
