import { handleApiError, ok, parseJson } from "@/lib/api";
import { getCurrentAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isWhatsAppConfigured, sendTextMessage, WhatsAppServiceError } from "@/lib/whatsapp-service";
import { getWhatsAppConfigStatus } from "@/lib/whatsapp-service";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const testSendSchema = z.object({
  to: z.string().trim().min(8).max(20),
  body: z.string().trim().min(1).max(4000)
});

export async function GET() {
  try {
    const { company } = await getCurrentAuthContext();
    return ok({
      ...getWhatsAppConfigStatus(),
      savedSettingsConfigured: Boolean(company.whatsappPhoneNumberId && company.whatsappAccessToken),
      webhookUrl: company.whatsappWebhookUrl,
      webhookStatus: process.env.WHATSAPP_VERIFY_TOKEN ? "Ready to verify" : "Verify token missing"
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, testSendSchema);
    const { company } = await getCurrentAuthContext();
    const normalizedPhone = input.to.replace(/[^\d]/g, "");
    const existingContact = await prisma.contact.findUnique({ where: { phone: normalizedPhone } });
    const contact = existingContact
      ? await prisma.contact.update({
          where: { id: existingContact.id },
          data: {
            companyId: company.id,
            optedIn: existingContact.doNotContact ? false : existingContact.optedIn
          }
        })
      : await prisma.contact.create({
          data: {
        companyId: company.id,
        name: "WhatsApp Test Recipient",
        phone: normalizedPhone,
        segment: "Sandbox Test",
        optedIn: true
          }
        });

    if (contact.doNotContact || !contact.optedIn) {
      return ok({ sent: false, provider: "blocked", message: "Contact is marked do-not-contact/unsubscribed." });
    }

    let providerMessageId: string | undefined;
    let status: "SENT" | "FAILED" = "FAILED";
    let errorMessage: string | undefined;
    const savedSettingsConfigured = Boolean(company.whatsappPhoneNumberId && company.whatsappAccessToken);
    const runtimeConfigured = isWhatsAppConfigured();
    const provider = savedSettingsConfigured && runtimeConfigured ? "whatsapp_cloud_api" : "not_configured";

    if (!savedSettingsConfigured || !runtimeConfigured) {
      errorMessage = "WhatsApp Cloud API is required to send real messages.";
    } else {
      try {
        const result = await sendTextMessage(normalizedPhone, input.body);
        providerMessageId = result.messages?.[0]?.id;
        status = "SENT";
      } catch (error) {
        status = "FAILED";
        errorMessage = error instanceof WhatsAppServiceError ? error.message : "WhatsApp API error.";
      }
    }

    await prisma.messageLog.create({
      data: {
        companyId: company.id,
        contactId: contact.id,
        body: input.body,
        direction: "OUTBOUND",
        status,
        sentAt: status === "SENT" ? new Date() : undefined,
        providerMessageId,
        errorMessage
      }
    });

    return ok({
      sent: status === "SENT",
      provider,
      providerMessageId,
      errorMessage,
      message: status === "SENT" ? "Message sent through WhatsApp Cloud API." : "WhatsApp Cloud API is required to send real messages."
    });
  } catch (error) {
    return handleApiError(error);
  }
}
