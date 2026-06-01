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
      openConversations,
      activeCampaigns,
      contacts,
      activeAutoReplyRules,
      teamMembers,
      aiCreditsUsed
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
      prisma.conversation.count({ where: { companyId, status: "OPEN" } }),
      prisma.campaign.count({ where: { companyId, status: { in: ["SCHEDULED", "RUNNING"] } } }),
      prisma.contact.count({ where: { companyId } }),
      prisma.autoReplyRule.count({ where: { companyId, isActive: true } }),
      prisma.user.count({ where: { companyId, isActive: true } }),
      prisma.aiGeneration.count({ where: { companyId } })
    ]);

    return ok({
      connectedNumbers,
      messagesSentToday,
      totalMessages,
      openConversations,
      activeCampaigns,
      contacts,
      activeAutoReplyRules,
      teamMembers,
      aiCreditsUsed,
      apiStatus: "Operational"
    });
  } catch (error) {
    return handleApiError(error);
  }
}
