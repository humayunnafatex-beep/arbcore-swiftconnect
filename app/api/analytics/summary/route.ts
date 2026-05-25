import { handleApiError, ok } from "@/lib/api";
import { getCurrentAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { company } = await getCurrentAuthContext();
    const companyId = company.id;
    const [messagesTotal, sent, delivered, read, failed, replies, campaigns, contacts, wonDeals, aiGenerations] =
      await Promise.all([
        prisma.messageLog.count({ where: { companyId } }),
        prisma.messageLog.count({ where: { companyId, direction: "OUTBOUND", status: { in: ["SENT", "DELIVERED", "READ"] } } }),
        prisma.messageLog.count({ where: { companyId, status: { in: ["DELIVERED", "READ"] } } }),
        prisma.messageLog.count({ where: { companyId, status: "READ" } }),
        prisma.messageLog.count({ where: { companyId, status: "FAILED" } }),
        prisma.messageLog.count({ where: { companyId, direction: "INBOUND" } }),
        prisma.campaign.count({ where: { companyId } }),
        prisma.contact.count({ where: { companyId } }),
        prisma.crmDeal.count({ where: { companyId, status: "WON" } }),
        prisma.aiGeneration.count({ where: { companyId } })
      ]);

    const deliveryRate = sent ? Math.round((delivered / sent) * 1000) / 10 : 0;
    const readRate = delivered ? Math.round((read / delivered) * 1000) / 10 : 0;
    const responseRate = sent ? Math.round((replies / sent) * 1000) / 10 : 0;
    const failureRate = messagesTotal ? Math.round((failed / messagesTotal) * 1000) / 10 : 0;

    return ok({
      totals: { messagesTotal, sent, delivered, read, failed, replies, campaigns, contacts, wonDeals, aiGenerations },
      rates: { deliveryRate, readRate, responseRate, failureRate },
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    return handleApiError(error);
  }
}
