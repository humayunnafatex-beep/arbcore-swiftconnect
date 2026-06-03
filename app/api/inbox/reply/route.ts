import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { ApiError, handleApiError } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { sendMessengerTextMessage } from "@/lib/messenger-service";
import { prisma } from "@/lib/prisma";
import { getSafeWhatsAppProviderErrorSummary, sendWhatsAppTextMessage, type SafeWhatsAppProviderError } from "@/lib/whatsapp-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const replySchema = z.object({
  channel: z.enum(["WHATSAPP", "MESSENGER"]),
  contactKey: z.string().trim().min(3).max(128),
  body: z.string().trim().min(1).max(4000)
});

const WHATSAPP_REQUIRED_MESSAGE = "WhatsApp Cloud API is required to send real messages.";
const MESSENGER_REQUIRED_MESSAGE = "Messenger Page API is required to send real messages.";

export async function POST(request: Request) {
  let companyId: string | undefined;
  let contactId: string | undefined;
  let channel: "WHATSAPP" | "MESSENGER" | undefined;
  let contactKey = "";
  let messageBody = "";

  try {
    const payload = await request.json().catch(() => null);
    const parsed = replySchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, status: "validation_failed", error: "Channel, recipient, and message body are required." },
        { status: 400 }
      );
    }

    const { context } = await requirePermission("messages.send");
    const { company } = context;
    companyId = company.id;
    channel = parsed.data.channel;
    contactKey = normalizeContactKey(channel, parsed.data.contactKey);
    messageBody = parsed.data.body.trim();

    if (!contactKey || !messageBody) {
      return NextResponse.json(
        { success: false, status: "validation_failed", error: "Recipient and message body are required." },
        { status: 400 }
      );
    }

    if (channel === "WHATSAPP" && !/^\d{8,16}$/.test(contactKey)) {
      return NextResponse.json(
        { success: false, status: "validation_failed", error: "Please check phone number and message." },
        { status: 400 }
      );
    }

    const contact = await upsertReplyContact({
      companyId: company.id,
      channel,
      contactKey
    });
    contactId = contact?.id;

    if (channel === "WHATSAPP") {
      if (!company.whatsappPhoneNumberId || !company.whatsappAccessToken) {
        await createSafeMessageLog({
          companyId: company.id,
          contactId: contact?.id,
          channel,
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
        to: contactKey,
        body: messageBody
      });

      return handleProviderResult({
        companyId: company.id,
        contactId: contact?.id,
        channel,
        body: messageBody,
        providerResult
      });
    }

    if (!company.messengerPageAccessToken) {
      await createSafeMessageLog({
        companyId: company.id,
        contactId: contact?.id,
        channel,
        body: messageBody,
        status: "FAILED",
        errorMessage: MESSENGER_REQUIRED_MESSAGE
      });

      return NextResponse.json(
        { success: false, status: "not_configured", error: MESSENGER_REQUIRED_MESSAGE },
        { status: 400 }
      );
    }

    const providerResult = await sendMessengerTextMessage({
      pageAccessToken: company.messengerPageAccessToken,
      recipientId: contactKey,
      body: messageBody
    });

    return handleProviderResult({
      companyId: company.id,
      contactId: contact?.id,
      channel,
      body: messageBody,
      providerResult
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return handleApiError(error);
    }

    if (companyId && channel && contactId && messageBody) {
      await createSafeMessageLog({
        companyId,
        contactId,
        channel,
        body: messageBody,
        status: "FAILED",
        errorMessage: "Inbox reply failed unexpectedly."
      }).catch(() => undefined);
    }

    console.error("Inbox reply POST error:", error);

    return NextResponse.json(
      { success: false, status: "provider_error", error: "Unable to process inbox reply." },
      { status: 500 }
    );
  }
}

async function handleProviderResult({
  companyId,
  contactId,
  channel,
  body,
  providerResult
}: {
  companyId: string;
  contactId?: string;
  channel: "WHATSAPP" | "MESSENGER";
  body: string;
  providerResult: { success: true; providerMessageId?: string } | { success: false; error: string; providerStatus?: number; providerError?: SafeWhatsAppProviderError };
}) {
  if (!providerResult.success) {
    const safeErrorMessage = channel === "WHATSAPP"
      ? getSafeWhatsAppProviderErrorSummary(providerResult.providerError)
      : providerResult.error;

    await createSafeMessageLog({
      companyId,
      contactId,
      channel,
      body,
      status: "FAILED",
      errorMessage: safeErrorMessage
    });

    return NextResponse.json(
      {
        success: false,
        status: "provider_error",
        error: providerResult.error,
        providerError: channel === "WHATSAPP" ? providerResult.providerError : undefined,
        data: { providerStatus: providerResult.providerStatus }
      },
      { status: 502 }
    );
  }

  await createSafeMessageLog({
    companyId,
    contactId,
    channel,
    body,
    status: "SENT",
    providerMessageId: providerResult.providerMessageId,
    sentAt: new Date()
  });

  return NextResponse.json({
    success: true,
    status: "sent_successfully",
    data: { providerMessageId: providerResult.providerMessageId }
  });
}

async function upsertReplyContact({
  companyId,
  channel,
  contactKey
}: {
  companyId: string;
  channel: "WHATSAPP" | "MESSENGER";
  contactKey: string;
}) {
  const existingContact = await prisma.contact.findFirst({
    where: {
      companyId,
      phone: contactKey
    }
  });

  if (existingContact) {
    return existingContact;
  }

  try {
    return await prisma.contact.create({
      data: {
        companyId,
        name: channel === "WHATSAPP" ? `WhatsApp ${contactKey}` : `Messenger ${contactKey}`,
        phone: contactKey,
        segment: channel === "WHATSAPP" ? "Inbox WhatsApp" : "Inbox Messenger",
        optedIn: true
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      // Current schema keeps Contact.phone globally unique. Do not reassign a
      // contact from another workspace during beta workspace testing.
      return null;
    }

    throw error;
  }
}

async function createSafeMessageLog(input: {
  companyId: string;
  contactId?: string;
  channel: "WHATSAPP" | "MESSENGER";
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
      channel: input.channel,
      body: input.body,
      direction: "OUTBOUND",
      status: input.status,
      providerMessageId: input.providerMessageId,
      errorMessage: input.errorMessage,
      sentAt: input.sentAt
    }
  });
}

function normalizeContactKey(channel: "WHATSAPP" | "MESSENGER", value: string) {
  const trimmed = value.trim();
  return channel === "WHATSAPP" ? trimmed.replace(/[^\d]/g, "") : trimmed;
}
