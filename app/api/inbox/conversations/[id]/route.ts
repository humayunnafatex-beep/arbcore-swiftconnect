import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ApiError, handleApiError } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const validConversationChannels = ["WHATSAPP", "MESSENGER"] as const;

type ConversationChannel = (typeof validConversationChannels)[number];

type MessageWithRelations = Prisma.MessageLogGetPayload<{
  include: { contact: true; whatsappAccount: true };
}>;

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { context } = await requirePermission("messages.viewLogs");
    const { company } = context;
    const { searchParams } = new URL(request.url);
    const limit = parseLimit(searchParams.get("limit"));
    const conversation = decodeConversationId(params.id);

    const recentMessages = await prisma.messageLog.findMany({
      where: buildMessageWhere({
        companyId: company.id,
        channel: conversation.channel,
        contactKey: conversation.contactKey
      }),
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { contact: true, whatsappAccount: true }
    });

    const orderedMessages = recentMessages.reverse();
    const firstMessage = orderedMessages[0] ?? null;
    const contact = conversation.channel === "WHATSAPP"
      ? await findMatchingContact(company.id, conversation.contactKey)
      : null;
    const state = await prisma.conversationState.findUnique({
      where: {
        companyId_channel_contactKey: {
          companyId: company.id,
          channel: conversation.channel,
          contactKey: conversation.contactKey
        }
      },
      select: {
        internalNote: true,
        followUpAt: true,
        followUpDone: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        conversation: {
          channel: conversation.channel,
          contactKey: conversation.contactKey,
          displayName: getBestDisplayName(contact, firstMessage),
          contact,
          referralContext: getConversationReferralContext(contact, orderedMessages),
          internalNote: state?.internalNote ?? "",
          followUpAt: state?.followUpAt?.toISOString() ?? null,
          followUpDone: state?.followUpDone ?? false,
          followUpStatus: getFollowUpStatus(state?.followUpAt ?? null, state?.followUpDone ?? false)
        },
        messages: orderedMessages.map((message) => ({
          id: message.id,
          direction: message.direction,
          status: message.status,
          body: previewText(message.body, 1000),
          bodyPreview: previewText(message.body),
          providerMessageId: message.providerMessageId,
          providerMessageType: message.providerMessageType,
          providerMetadataSummary: message.providerMetadataSummary,
          referralSourceType: message.referralSourceType,
          referralSourceId: message.referralSourceId,
          referralSourceUrl: message.referralSourceUrl,
          referralHeadline: message.referralHeadline,
          referralBody: message.referralBody,
          referralMediaType: message.referralMediaType,
          referralImageUrl: message.referralImageUrl,
          referralVideoUrl: message.referralVideoUrl,
          referralCtwaClid: message.referralCtwaClid,
          errorMessage: message.errorMessage,
          mediaId: message.mediaId,
          mediaType: message.mediaType,
          mediaMimeType: message.mediaMimeType,
          mediaFilename: message.mediaFilename,
          createdAt: message.createdAt
        }))
      }
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return handleApiError(error);
    }

    console.error("Inbox conversation detail GET error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to load inbox conversation." },
      { status: 500 }
    );
  }
}

function buildMessageWhere({
  companyId,
  channel,
  contactKey
}: {
  companyId: string;
  channel: ConversationChannel;
  contactKey: string;
}): Prisma.MessageLogWhereInput {
  return {
    companyId,
    channel,
    OR: [
      { contact: { phone: contactKey } },
      { whatsappAccount: { phoneNumber: contactKey } },
      { providerMessageId: contactKey }
    ]
  };
}

function parseLimit(value: string | null) {
  const parsed = Number(value ?? 100);
  if (!Number.isFinite(parsed)) return 100;
  return Math.min(Math.max(Math.floor(parsed), 1), 100);
}

function decodeConversationId(id: string): { channel: ConversationChannel; contactKey: string } {
  try {
    const parsed = JSON.parse(Buffer.from(id, "base64url").toString("utf8")) as {
      channel?: string;
      contactKey?: string;
    };

    if (!isConversationChannel(parsed.channel) || !parsed.contactKey) {
      throw new Error("Invalid conversation id");
    }

    return {
      channel: parsed.channel,
      contactKey: parsed.contactKey
    };
  } catch {
    throw new ApiError(400, "INVALID_CONVERSATION", "Invalid inbox conversation.");
  }
}

function isConversationChannel(value: string | undefined): value is ConversationChannel {
  return value === "WHATSAPP" || value === "MESSENGER";
}

function getDisplayName(message: MessageWithRelations) {
  return message.contact?.name ?? message.whatsappAccount?.businessName ?? null;
}

function getBestDisplayName(contact: Awaited<ReturnType<typeof findMatchingContact>>, message: MessageWithRelations | null) {
  return contact?.name || contact?.whatsappProfileName || (message ? getDisplayName(message) : null);
}

async function findMatchingContact(companyId: string, contactKey: string) {
  const candidates = phoneMatchCandidates(contactKey);
  const contacts = await prisma.contact.findMany({
    where: { companyId },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      stage: true,
      tags: true,
      whatsappProfileName: true,
      profileSource: true,
      lastReferralSourceType: true,
      lastReferralSourceId: true,
      lastReferralSourceUrl: true,
      lastReferralHeadline: true,
      lastReferralBody: true,
      lastReferralMediaType: true,
      lastReferralImageUrl: true,
      lastReferralVideoUrl: true,
      lastReferralCtwaClid: true,
      lastReferralAt: true
    }
  });
  const contact = contacts.find((item) => {
    return Array.from(phoneMatchCandidates(item.phone)).some((candidate) => candidates.has(candidate));
  }) ?? null;

  return contact
    ? {
        id: contact.id,
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        status: contact.stage,
        tags: contact.tags,
        whatsappProfileName: contact.whatsappProfileName,
        profileSource: contact.profileSource,
        lastReferralSourceType: contact.lastReferralSourceType,
        lastReferralSourceId: contact.lastReferralSourceId,
        lastReferralSourceUrl: contact.lastReferralSourceUrl,
        lastReferralHeadline: contact.lastReferralHeadline,
        lastReferralBody: contact.lastReferralBody,
        lastReferralMediaType: contact.lastReferralMediaType,
        lastReferralImageUrl: contact.lastReferralImageUrl,
        lastReferralVideoUrl: contact.lastReferralVideoUrl,
        lastReferralCtwaClid: contact.lastReferralCtwaClid,
        lastReferralAt: contact.lastReferralAt?.toISOString() ?? null
      }
    : null;
}

function getConversationReferralContext(
  contact: Awaited<ReturnType<typeof findMatchingContact>>,
  messages: MessageWithRelations[]
) {
  if (contact?.lastReferralSourceType || contact?.lastReferralHeadline || contact?.lastReferralSourceId) {
    return {
      sourceType: contact.lastReferralSourceType,
      sourceId: contact.lastReferralSourceId,
      sourceUrl: contact.lastReferralSourceUrl,
      headline: contact.lastReferralHeadline,
      body: contact.lastReferralBody,
      mediaType: contact.lastReferralMediaType,
      imageUrl: contact.lastReferralImageUrl,
      videoUrl: contact.lastReferralVideoUrl,
      ctwaClid: contact.lastReferralCtwaClid,
      referredAt: contact.lastReferralAt
    };
  }

  const referralMessage = [...messages].reverse().find((message) => (
    message.referralSourceType || message.referralHeadline || message.referralSourceId
  ));

  return referralMessage
    ? {
        sourceType: referralMessage.referralSourceType,
        sourceId: referralMessage.referralSourceId,
        sourceUrl: referralMessage.referralSourceUrl,
        headline: referralMessage.referralHeadline,
        body: referralMessage.referralBody,
        mediaType: referralMessage.referralMediaType,
        imageUrl: referralMessage.referralImageUrl,
        videoUrl: referralMessage.referralVideoUrl,
        ctwaClid: referralMessage.referralCtwaClid,
        referredAt: referralMessage.createdAt.toISOString()
      }
    : null;
}

function phoneMatchCandidates(phone: string) {
  const normalized = normalizePhoneForMatch(phone);
  const candidates = new Set<string>();
  if (normalized) candidates.add(normalized);

  if (normalized.startsWith("8801") && normalized.length === 13) {
    candidates.add(`0${normalized.slice(3)}`);
  }

  if (normalized.startsWith("01") && normalized.length === 11) {
    candidates.add(`880${normalized.slice(1)}`);
  }

  return candidates;
}

function normalizePhoneForMatch(phone: string) {
  return phone.replace(/[^\d]/g, "");
}

function getFollowUpStatus(followUpAt: Date | null, followUpDone: boolean): "NONE" | "DUE" | "UPCOMING" | "DONE" {
  if (followUpDone) return "DONE";
  if (!followUpAt) return "NONE";
  return followUpAt.getTime() <= Date.now() ? "DUE" : "UPCOMING";
}

function previewText(value: string, maxLength = 140) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3)}...`;
}
