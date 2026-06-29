import { prisma } from "@/lib/prisma";

export type DashboardAttentionCounts = {
  overdueFollowUps: number;
  todayFollowUps: number;
  unreadConversations: number;
  failedMessages: number;
};

export async function getDashboardAttentionCounts(companyId: string): Promise<DashboardAttentionCounts> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const [
    overdueConversationFollowUps,
    overdueOrderFollowUps,
    todayConversationFollowUps,
    todayOrderFollowUps,
    unreadConversations,
    failedMessages
  ] = await Promise.all([
    prisma.conversationState.count({ where: { companyId, followUpAt: { lt: todayStart }, followUpDone: false } }),
    prisma.order.count({ where: { companyId, followUpAt: { lt: todayStart }, followUpDone: false } }),
    prisma.conversationState.count({ where: { companyId, followUpAt: { gte: todayStart, lt: tomorrowStart }, followUpDone: false } }),
    prisma.order.count({ where: { companyId, followUpAt: { gte: todayStart, lt: tomorrowStart }, followUpDone: false } }),
    prisma.conversationState.count({ where: { companyId, isRead: false } }),
    prisma.messageLog.count({ where: { companyId, status: "FAILED" } })
  ]);

  return {
    overdueFollowUps: overdueConversationFollowUps + overdueOrderFollowUps,
    todayFollowUps: todayConversationFollowUps + todayOrderFollowUps,
    unreadConversations,
    failedMessages
  };
}
