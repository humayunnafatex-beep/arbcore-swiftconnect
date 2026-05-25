import { ApiError, handleApiError, ok, parseJson } from "@/lib/api";
import { getCurrentAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { campaignSendSchema } from "@/lib/validators";
import { isWhatsAppConfigured, sendTextMessage, WhatsAppServiceError } from "@/lib/whatsapp-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = {
  params: { id: string };
};

export async function POST(request: Request, { params }: Context) {
  try {
    const input = await parseJson(request, campaignSendSchema);
    const { company } = await getCurrentAuthContext();
    const companyId = company.id;
    const campaign = await prisma.campaign.findFirst({ where: { id: params.id, companyId } });

    if (!campaign) {
      throw new ApiError(404, "CAMPAIGN_NOT_FOUND", "Campaign was not found.");
    }

    const contacts = await prisma.contact.findMany({
      where: {
        companyId,
        optedIn: true,
        doNotContact: false,
        ...(campaign.targetSegment ? { segment: campaign.targetSegment } : {})
      },
      take: input.limit ?? 1000,
      orderBy: { createdAt: "desc" }
    });

    const messageBody = input.messageBody ?? `Template: ${campaign.templateName}`;
    const sentAt = new Date();

    const useWhatsApp = isWhatsAppConfigured();
    const sendResults: Array<{
      contactId: string;
      status: "SENT" | "FAILED";
      providerMessageId: string | null;
      errorMessage: string | null;
    }> = [];

    for (const contact of contacts) {
      if (!useWhatsApp) {
        sendResults.push({ contactId: contact.id, status: "SENT" as const, providerMessageId: null, errorMessage: null });
        continue;
      }

      try {
        const response = await sendTextMessage(contact.phone, messageBody);
        sendResults.push({
          contactId: contact.id,
          status: "SENT" as const,
          providerMessageId: response.messages?.[0]?.id ?? null,
          errorMessage: null
        });
      } catch (error) {
        const message = error instanceof WhatsAppServiceError ? error.message : "WhatsApp send failed.";
        sendResults.push({ contactId: contact.id, status: "FAILED" as const, providerMessageId: null, errorMessage: message });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      if (sendResults.length > 0) {
        await tx.messageLog.createMany({
          data: sendResults.map((sendResult) => ({
            body: messageBody,
            companyId,
            direction: "OUTBOUND",
            status: sendResult.status,
            sentAt: sendResult.status === "SENT" ? sentAt : undefined,
            providerMessageId: sendResult.providerMessageId ?? undefined,
            errorMessage: sendResult.errorMessage ?? undefined,
            contactId: sendResult.contactId,
            campaignId: campaign.id,
            whatsappAccountId: campaign.whatsappAccountId
          }))
        });
      }

      const updatedCampaign = await tx.campaign.update({
        where: { id: campaign.id },
        data: { status: "SENT", sentAt }
      });

      if (campaign.whatsappAccountId) {
        await tx.whatsAppAccount.update({
          where: { id: campaign.whatsappAccountId },
          data: { messagesUsed24h: { increment: contacts.length }, lastSyncedAt: sentAt }
        });
      }

      return updatedCampaign;
    });

    return ok({
      campaign: result,
      sentCount: sendResults.filter((item) => item.status === "SENT").length,
      failedCount: sendResults.filter((item) => item.status === "FAILED").length,
      provider: useWhatsApp ? "whatsapp_cloud_api" : "mock"
    });
  } catch (error) {
    return handleApiError(error);
  }
}
