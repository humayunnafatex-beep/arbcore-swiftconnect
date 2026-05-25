import { handleApiError, ok } from "@/lib/api";
import { getCurrentAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { company } = await getCurrentAuthContext();
    const companyId = company.id;

    const [
      connectedNumbers,
      messagesSentToday,
      openConversations,
      activeCampaigns,
      contacts,
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
      prisma.conversation.count({ where: { companyId, status: "OPEN" } }),
      prisma.campaign.count({ where: { companyId, status: { in: ["SCHEDULED", "RUNNING"] } } }),
      prisma.contact.count({ where: { companyId } }),
      prisma.aiGeneration.count({ where: { companyId } })
    ]);

    return ok({
      connectedNumbers,
      messagesSentToday,
      openConversations,
      activeCampaigns,
      contacts,
      aiCreditsUsed,
      apiStatus: "Operational"
    });
  } catch (error) {
    return handleApiError(error);
  }
}
