import { NextResponse } from "next/server";
import { getCurrentAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const testSendSchema = z.object({
  to: z.string().trim().min(8).max(20),
  body: z.string().trim().min(1).max(4000)
});

const WHATSAPP_REQUIRED_MESSAGE = "WhatsApp Cloud API is required to send real messages.";
const WHATSAPP_API_VERSION = "v20.0";

export async function GET() {
  try {
    const { company } = await getCurrentAuthContext();
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
    const { company } = await getCurrentAuthContext();
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

    const providerResponse = await fetch(`https://graph.facebook.com/${WHATSAPP_API_VERSION}/${company.whatsappPhoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${company.whatsappAccessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: normalizedPhone,
        type: "text",
        text: { body: messageBody }
      })
    });

    const providerBody = await providerResponse.json().catch(() => ({}));

    if (!providerResponse.ok) {
      await createSafeMessageLog({
        companyId: company.id,
        contactId: contact.id,
        body: messageBody,
        status: "FAILED",
        errorMessage: "WhatsApp provider rejected the message."
      });

      return NextResponse.json(
        {
          success: false,
          status: "provider_error",
          error: "WhatsApp provider rejected the message.",
          data: { providerStatus: providerResponse.status }
        },
        { status: 502 }
      );
    }

    const providerMessageId = getProviderMessageId(providerBody);
    await createSafeMessageLog({
      companyId: company.id,
      contactId: contact.id,
      body: messageBody,
      status: "SENT",
      providerMessageId,
      sentAt: new Date()
    });

    return NextResponse.json({
      success: true,
      status: "sent_successfully",
      data: { providerMessageId }
    });
  } catch (error) {
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

function getProviderMessageId(payload: unknown) {
  if (!payload || typeof payload !== "object" || !("messages" in payload) || !Array.isArray(payload.messages)) {
    return undefined;
  }

  const first = payload.messages[0];
  return first && typeof first === "object" && "id" in first && typeof first.id === "string" ? first.id : undefined;
}
