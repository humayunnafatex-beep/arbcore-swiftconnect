import { NextResponse } from "next/server";
import { ApiError, handleApiError } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppTextMessage } from "@/lib/whatsapp-service";
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
    const { context } = await requirePermission("messages.send");
    const { company } = context;
    const configured = Boolean(company.whatsappPhoneNumberId && company.whatsappAccessToken);

    return NextResponse.json({
      success: true,
      data: {
      configured,
      savedSettingsConfigured: Boolean(company.whatsappPhoneNumberId && company.whatsappAccessToken),
        phoneNumberId: company.whatsappPhoneNumberId,
        hasAccessToken: Boolean(company.whatsappAccessToken),
      webhookUrl: company.whatsappWebhookUrl,
        webhookStatus: company.whatsappVerifyToken ? "Ready to verify" : "Verify token missing",
        state: configured ? "configured" : "not_configured"
      }
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return handleApiError(error);
    }

    return NextResponse.json(
      { success: false, status: "provider_error", error: "Unable to load WhatsApp configuration." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let companyId: string | undefined;
  let contactId: string | undefined;
  let messageBody = "";
  let normalizedPhone = "";

  try {
    const payload = await request.json().catch(() => null);
    const parsed = testSendSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, status: "validation_failed", error: "Recipient phone and message body are required." },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const { context } = await requirePermission("messages.send");
    const { company } = context;
    companyId = company.id;
    messageBody = input.body.trim();
    normalizedPhone = input.to.trim().replace(/[^\d]/g, "");

    if (!normalizedPhone || !messageBody) {
      return NextResponse.json(
        { success: false, status: "validation_failed", error: "Recipient phone and message body are required." },
        { status: 400 }
      );
    }

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
    contactId = contact.id;

    if (contact.doNotContact || !contact.optedIn) {
      return NextResponse.json(
        { success: false, status: "validation_failed", error: "Contact is marked do-not-contact/unsubscribed." },
        { status: 400 }
      );
    }

    const savedSettingsConfigured = Boolean(company.whatsappPhoneNumberId && company.whatsappAccessToken);

    if (!savedSettingsConfigured) {
      await createSafeMessageLog({
        companyId: company.id,
        contactId: contact.id,
        body: messageBody,
        status: "FAILED",
        errorMessage: WHATSAPP_REQUIRED_MESSAGE
      });

      return NextResponse.json(
        { success: false, status: "not_configured", error: WHATSAPP_REQUIRED_MESSAGE },
        { status: 400 }
      );
    }

    const providerResult = await sendWhatsAppTextMessage({
      phoneNumberId: company.whatsappPhoneNumberId,
      accessToken: company.whatsappAccessToken,
      to: normalizedPhone,
      body: messageBody
    });

    if (!providerResult.success) {
      await createSafeMessageLog({
        companyId: company.id,
        contactId: contact.id,
        body: messageBody,
        status: "FAILED",
        errorMessage: providerResult.error
      });

      return NextResponse.json(
        {
          success: false,
          status: "provider_error",
          error: providerResult.error,
          data: { providerStatus: providerResult.providerStatus }
        },
        { status: 502 }
      );
    }

    await createSafeMessageLog({
      companyId: company.id,
      contactId: contact.id,
      body: messageBody,
      status: "SENT",
      providerMessageId: providerResult.providerMessageId,
      sentAt: new Date()
    });

    return NextResponse.json({
      success: true,
      status: "sent_successfully",
      data: { providerMessageId: providerResult.providerMessageId }
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return handleApiError(error);
    }

    if (companyId && contactId && messageBody) {
      await createSafeMessageLog({
        companyId,
        contactId,
        body: messageBody,
        status: "FAILED",
        errorMessage: "WhatsApp test send failed unexpectedly."
      }).catch(() => undefined);
    }

    return NextResponse.json(
      { success: false, status: "provider_error", error: "Unable to process WhatsApp test send." },
      { status: 500 }
    );
  }
}

async function createSafeMessageLog(input: {
  companyId: string;
  contactId?: string;
  body: string;
  status: "SENT" | "FAILED";
  providerMessageId?: string;
  errorMessage?: string;
  sentAt?: Date;
}) {
  return prisma.messageLog.create({
    data: {
      companyId: input.companyId,
      contactId: input.contactId,
      body: input.body,
      direction: "OUTBOUND",
      status: input.status,
      providerMessageId: input.providerMessageId,
      errorMessage: input.errorMessage,
      sentAt: input.sentAt
    }
  });
}
