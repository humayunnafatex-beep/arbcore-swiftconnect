import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { ApiError, handleApiError } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { sendMessengerTextMessage } from "@/lib/messenger-service";
import { prisma } from "@/lib/prisma";
import {
  getSafeWhatsAppProviderErrorSummary,
  sendWhatsAppMediaMessage,
  sendWhatsAppTextMessage,
  uploadWhatsAppMedia,
  type SafeWhatsAppProviderError,
  type WhatsAppMediaType
} from "@/lib/whatsapp-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const replySchema = z.object({
  channel: z.enum(["WHATSAPP", "MESSENGER"]),
  contactKey: z.string().trim().min(3).max(128),
  body: z.string().trim().max(4000).default("")
});

const WHATSAPP_REQUIRED_MESSAGE = "WhatsApp Cloud API is required to send real messages.";
const MESSENGER_REQUIRED_MESSAGE = "Messenger Page API is required to send real messages.";
const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const DOCUMENT_MIME_TYPES = new Set(["application/pdf"]);
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const PDF_MAX_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  let companyId: string | undefined;
  let contactId: string | undefined;
  let channel: "WHATSAPP" | "MESSENGER" | undefined;
  let contactKey = "";
  let messageBody = "";
  let attachment: File | null = null;
  let mediaType: WhatsAppMediaType | null = null;
  let logBody = "";

  try {
    const parsedPayload = await parseReplyRequest(request);
    const parsed = replySchema.safeParse(parsedPayload);

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
    attachment = parsedPayload.attachment;
    const attachmentValidation = validateAttachment(attachment);
    if (!attachmentValidation.success) {
      return NextResponse.json(
        { success: false, status: "validation_failed", error: attachmentValidation.error },
        { status: 400 }
      );
    }
    mediaType = attachmentValidation.mediaType;
    logBody = buildLogBody(messageBody, attachment, mediaType);

    if (!contactKey || (!messageBody && !attachment)) {
      return NextResponse.json(
        { success: false, status: "validation_failed", error: "Recipient and message body or attachment are required." },
        { status: 400 }
      );
    }

    if (attachment && channel !== "WHATSAPP") {
      return NextResponse.json(
        { success: false, status: "validation_failed", error: "Phase 1 media replies support WhatsApp only." },
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
          body: logBody,
          status: "FAILED",
          errorMessage: WHATSAPP_REQUIRED_MESSAGE
        });

        return NextResponse.json(
          { success: false, status: "not_configured", error: WHATSAPP_REQUIRED_MESSAGE },
          { status: 400 }
        );
      }

      if (attachment && mediaType) {
        const uploadResult = await uploadWhatsAppMedia({
          phoneNumberId: company.whatsappPhoneNumberId,
          accessToken: company.whatsappAccessToken,
          file: attachment,
          mimeType: attachment.type
        });

        if (!uploadResult.success) {
          return handleProviderResult({
            companyId: company.id,
            contactId: contact?.id,
            channel,
            body: logBody,
            providerResult: uploadResult
          });
        }

        const providerResult = await sendWhatsAppMediaMessage({
          phoneNumberId: company.whatsappPhoneNumberId,
          accessToken: company.whatsappAccessToken,
          to: contactKey,
          mediaId: uploadResult.mediaId,
          mediaType,
          caption: messageBody,
          filename: attachment.name
        });

        return handleProviderResult({
          companyId: company.id,
          contactId: contact?.id,
          channel,
          body: logBody,
          providerResult
        });
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
        body: logBody,
        providerResult
      });
    }

    if (!company.messengerPageAccessToken) {
      await createSafeMessageLog({
        companyId: company.id,
        contactId: contact?.id,
        channel,
        body: logBody,
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
      body: logBody,
      providerResult
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return handleApiError(error);
    }

    if (companyId && channel && contactId && (messageBody || logBody)) {
      await createSafeMessageLog({
        companyId,
        contactId,
        channel,
        body: logBody || messageBody,
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

async function parseReplyRequest(request: Request): Promise<{
  channel?: unknown;
  contactKey?: unknown;
  body?: unknown;
  attachment: File | null;
}> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const attachmentValue = formData.get("attachment");
    return {
      channel: formData.get("channel"),
      contactKey: formData.get("contactKey"),
      body: formData.get("body") ?? "",
      attachment: attachmentValue instanceof File && attachmentValue.size > 0 ? attachmentValue : null
    };
  }

  const payload = await request.json().catch(() => null);
  return {
    ...(payload && typeof payload === "object" ? payload : {}),
    attachment: null
  };
}

function validateAttachment(file: File | null):
  | { success: true; mediaType: WhatsAppMediaType | null }
  | { success: false; error: string } {
  if (!file) {
    return { success: true, mediaType: null };
  }

  if (IMAGE_MIME_TYPES.has(file.type)) {
    if (file.size > IMAGE_MAX_BYTES) {
      return { success: false, error: "Image attachments must be 5 MB or smaller." };
    }

    return { success: true, mediaType: "image" };
  }

  if (DOCUMENT_MIME_TYPES.has(file.type)) {
    if (file.size > PDF_MAX_BYTES) {
      return { success: false, error: "PDF attachments must be 10 MB or smaller." };
    }

    return { success: true, mediaType: "document" };
  }

  return { success: false, error: "Phase 1 supports image and PDF attachments only." };
}

function buildLogBody(body: string, attachment: File | null, mediaType: WhatsAppMediaType | null) {
  const caption = body.trim();
  if (!attachment || !mediaType) return caption;

  if (mediaType === "image") {
    return `[image]${caption ? ` ${caption}` : ""}`;
  }

  return `[document] ${attachment.name}${caption ? ` - ${caption}` : ""}`;
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
      ? providerResult.providerError
        ? getSafeWhatsAppProviderErrorSummary(providerResult.providerError)
        : providerResult.error
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
