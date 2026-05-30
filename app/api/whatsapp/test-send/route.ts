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

const WHATSAPP_REQUIRED_MESSAGE = "WhatsApp Cloud API is required to send real messages.";

export async function GET() {
  try {
    const { company } = await getCurrentAuthContext();
    return ok({
      ...getWhatsAppConfigStatus(),
      savedSettingsConfigured: Boolean(company.whatsappPhoneNumberId && company.whatsappAccessToken),
      webhookUrl: company.whatsappWebhookUrl,
      webhookStatus: process.env.WHATSAPP_VERIFY_TOKEN ? "Ready to verify" : "Verify token missing",
      state: isWhatsAppConfigured() && company.whatsappPhoneNumberId && company.whatsappAccessToken ? "configured" : "not_configured"
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, testSendSchema);
    const { company } = await getCurrentAuthContext();
    const messageBody = input.body.trim();
    const normalizedPhone = input.to.trim().replace(/[^\d]/g, "");
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
    const hasRequiredFields = Boolean(savedSettingsConfigured && runtimeConfigured && normalizedPhone && messageBody);
    const provider = hasRequiredFields ? "whatsapp_cloud_api" : "not_configured";
    let state: "not_configured" | "validation_failed" | "provider_error" | "sent_successfully" = "not_configured";

    if (!normalizedPhone || !messageBody) {
      state = "validation_failed";
      errorMessage = "Recipient phone and message body are required.";
    } else if (!savedSettingsConfigured || !runtimeConfigured) {
      state = "not_configured";
      errorMessage = WHATSAPP_REQUIRED_MESSAGE;
    } else {
      try {
        // TODO: Production launch should verify webhook health before enabling high-volume sends.
        const result = await sendTextMessage(normalizedPhone, messageBody);
        providerMessageId = result.messages?.[0]?.id;
        status = "SENT";
        state = "sent_successfully";
      } catch (error) {
        status = "FAILED";
        state = "provider_error";
        errorMessage = error instanceof WhatsAppServiceError ? "WhatsApp API request failed. Check credentials and recipient number." : "WhatsApp API error.";
      }
    }

    await prisma.messageLog.create({
      data: {
        companyId: company.id,
        contactId: contact.id,
        body: messageBody,
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
      state,
      providerMessageId,
      errorMessage,
      message: status === "SENT" ? "Message sent through WhatsApp Cloud API." : errorMessage ?? WHATSAPP_REQUIRED_MESSAGE
    });
  } catch (error) {
    return handleApiError(error);
  }
}
