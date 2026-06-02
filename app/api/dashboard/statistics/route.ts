import { handleApiError, ok } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
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
      contacts,
      hotLeads,
      activeContacts,
      activeAutoReplyRules,
      teamMembers,
      aiCreditsUsed,
      subscription,
      paymentGroups,
      lastPayment
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
      prisma.campaign.count({ where: { companyId, status: { in: ["SCHEDULED", "RUNNING"] } } }),
      prisma.contact.count({ where: { companyId } }),
      prisma.contact.count({ where: { companyId, stage: { in: ["NEW_LEAD", "INTERESTED", "FOLLOW_UP"] } } }),
      prisma.contact.count({ where: { companyId, doNotContact: false, optedIn: true } }),
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
      contacts,
      totalContacts: contacts,
      hotLeads,
      activeContacts,
      activeAutoReplyRules,
      teamMembers,
      aiCreditsUsed,
      whatsappConfigured: Boolean(company.whatsappPhoneNumberId && company.whatsappAccessToken),
      messengerConfigured: Boolean(company.messengerPageAccessToken),
      billing: {
        plan: subscription?.plan || "ENTERPRISE_BETA",
        status: subscription?.status || "ACTIVE",
        pendingPaymentCount: pendingPayments?._count._all ?? 0,
        pendingPaymentAmount: pendingPayments?._sum.amount ?? 0,
        lastPaymentDate: (lastPayment?.paidAt ?? lastPayment?.createdAt)?.toISOString() ?? null,
        lastPaymentAmount: lastPayment?.amount ?? null,
        currency: lastPayment?.currency || "BDT"
      },
      apiStatus: "Operational"
    });
  } catch (error) {
    return handleApiError(error);
  }
}
