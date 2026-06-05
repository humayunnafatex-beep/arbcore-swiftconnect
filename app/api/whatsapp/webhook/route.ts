import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentCompany } from "@/lib/current-company";
import { prisma } from "@/lib/prisma";
import { getCompanyForProviderWebhook, type ProviderRoutingResult } from "@/lib/provider-routing";
import { parseWebhookEvent, sendWhatsAppTextMessage, validateSignature } from "@/lib/whatsapp-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  try {
    const company = await getWebhookCompany();
    const verifyToken = company?.whatsappVerifyToken || process.env.WHATSAPP_VERIFY_TOKEN;

    if (mode === "subscribe" && challenge && verifyToken && token === verifyToken) {
      return new Response(challenge, { status: 200 });
    }

    return new Response("Webhook verification failed.", { status: 403 });
  } catch {
    return new Response("Webhook verification failed.", { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-hub-signature-256");

    if (!validateSignature(rawBody, signature)) {
      return NextResponse.json(
        { success: false, error: "Invalid WhatsApp webhook signature." },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody) as Prisma.InputJsonValue;
    const routing = await getCompanyForProviderWebhook({ channel: "WHATSAPP", payload });
    const company = routing.company;

    if (!company) {
      await prisma.webhookEvent.create({
        data: {
          provider: "whatsapp",
          eventType: "unmatched_provider",
          payload: unmatchedWhatsAppPayload(routing)
        }
      });

      return NextResponse.json({ success: true, data: { received: true, messages: 0 } });
    }

    const parsed = parseWebhookEvent(payload);

    await prisma.webhookEvent.create({
      data: {
        companyId: company.id,
        provider: "whatsapp",
        eventType: parsed.messages.length ? "messages" : parsed.statuses.length ? "statuses" : "unknown",
        payload: withWhatsAppRoutingMetadata(payload, routing)
      }
    });

    for (const message of parsed.messages) {
      const body = getInboundMessageBody(message);
      const contact = await findOrCreateWebhookContact({
        companyId: company.id,
        phone: message.from,
        profileName: message.profileName,
        referral: message.referral,
        segment: "WhatsApp Inbox"
      });
      const referralData = getReferralLogData(message.referral);

      const existingInboundLog = await prisma.messageLog.findFirst({
        where: {
          companyId: company.id,
          direction: "INBOUND",
          providerMessageId: message.id
        },
        select: { id: true }
      });

      if (existingInboundLog) {
        continue;
      }

      await prisma.messageLog.create({
        data: {
          companyId: company.id,
          contactId: contact?.id,
          channel: "WHATSAPP",
          body,
          direction: "INBOUND",
          status: "RECEIVED",
          providerMessageId: message.id,
          providerMessageType: message.type,
          providerMetadataSummary: getProviderMetadataSummary(message),
          ...referralData,
          mediaId: message.media?.id ?? "",
          mediaType: message.media?.type ?? "",
          mediaMimeType: message.media?.mimeType ?? "",
          mediaSha256: message.media?.sha256 ?? "",
          mediaFilename: message.media?.filename ?? ""
        }
      });

      await markConversationUnread({
        companyId: company.id,
        channel: "WHATSAPP",
        contactKey: message.from
      });

      if (!message.text) {
        continue;
      }

      const matchedRule = await findMatchedAutoReplyRule(company.id, message.text);

      if (!matchedRule) {
        continue;
      }

      const autoReplyEvent = await prisma.autoReplyEvent.create({
        data: {
          companyId: company.id,
          ruleId: matchedRule.id,
          ruleName: ruleName(matchedRule.keyword),
          channel: "WHATSAPP",
          customerKey: message.from,
          inboundTextPreview: previewText(message.text),
          replyPreview: previewText(matchedRule.response),
          status: "ATTEMPTED"
        }
      });

      const autoReplyResult = await sendWhatsAppTextMessage({
        phoneNumberId: company.whatsappPhoneNumberId,
        accessToken: company.whatsappAccessToken,
        to: message.from,
        body: matchedRule.response
      });

      await prisma.autoReplyEvent.update({
        where: { id: autoReplyEvent.id },
        data: {
          status: autoReplyResult.success ? "SENT" : "FAILED",
          providerMessageId: autoReplyResult.success ? autoReplyResult.providerMessageId ?? "" : "",
          errorMessage: autoReplyResult.success ? "" : previewText(autoReplyResult.error ?? "WhatsApp provider rejected the auto reply.", 280)
        }
      });

      await prisma.messageLog.create({
        data: {
          companyId: company.id,
          contactId: contact?.id,
          channel: "WHATSAPP",
          body: matchedRule.response,
          direction: "OUTBOUND",
          status: autoReplyResult.success ? "SENT" : "FAILED",
          providerMessageId: autoReplyResult.success ? autoReplyResult.providerMessageId : undefined,
          errorMessage: autoReplyResult.success ? undefined : autoReplyResult.error,
          sentAt: autoReplyResult.success ? new Date() : undefined
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: { received: true, messages: parsed.messages.length, statuses: parsed.statuses.length }
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to process WhatsApp webhook." },
      { status: 500 }
    );
  }
}

async function findMatchedAutoReplyRule(companyId: string, inboundText: string) {
  const normalizedInbound = normalizeText(inboundText);

  if (!normalizedInbound) {
    return null;
  }

  const rules = await prisma.autoReplyRule.findMany({
    where: { companyId, isActive: true },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }]
  });

  return rules.find((rule) => {
    const keyword = normalizeText(rule.keyword);
    if (!keyword) return false;

    if (rule.matchMode === "EXACT") {
      return normalizedInbound === keyword;
    }

    if (rule.matchMode === "STARTS_WITH") {
      return normalizedInbound.startsWith(keyword);
    }

    return normalizedInbound.includes(keyword);
  }) ?? null;
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function previewText(value: string, maxLength = 180) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3)}...`;
}

function ruleName(keyword: string) {
  return keyword ? `${keyword.charAt(0).toUpperCase()}${keyword.slice(1)} Reply` : "Auto Reply Rule";
}

function getInboundMessageBody(message: { text?: string; type: string; media?: { type?: string } }) {
  if (message.text) return message.text;

  switch (message.media?.type ?? message.type) {
    case "audio":
      return "[audio] Audio message";
    case "image":
      return "[image] Image message";
    case "document":
      return "[document] Document message";
    case "video":
      return "[video] Video message";
    default:
      return `[unsupported: ${message.type || "unknown"}]`;
  }
}

function getProviderMetadataSummary(message: {
  type: string;
  hasContext?: boolean;
  errors?: Array<{
    code?: string | number;
    title?: string;
    message?: string;
  }>;
}) {
  const parts = [
    `type=${message.type || "unknown"}`,
    `has_context=${Boolean(message.hasContext)}`,
    `has_errors=${Boolean(message.errors?.length)}`
  ];

  for (const error of message.errors ?? []) {
    const errorParts = [
      error.code !== undefined ? `code=${error.code}` : null,
      error.title ? `title=${previewText(error.title, 80)}` : null,
      error.message ? `message=${previewText(error.message, 120)}` : null
    ].filter(Boolean);

    if (errorParts.length) {
      parts.push(`error(${errorParts.join(", ")})`);
    }
  }

  return previewText(parts.join("; "), 360);
}

async function markConversationUnread({
  companyId,
  channel,
  contactKey
}: {
  companyId: string;
  channel: string;
  contactKey: string;
}) {
  await prisma.conversationState.upsert({
    where: {
      companyId_channel_contactKey: {
        companyId,
        channel,
        contactKey
      }
    },
    update: {
      isRead: false
    },
    create: {
      companyId,
      channel,
      contactKey,
      status: "OPEN",
      isRead: false
    }
  });
}

async function findOrCreateWebhookContact({
  companyId,
  phone,
  profileName,
  referral,
  segment
}: {
  companyId: string;
  phone: string;
  profileName?: string;
  referral?: {
    sourceType?: string;
    sourceId?: string;
    sourceUrl?: string;
    headline?: string;
    body?: string;
    mediaType?: string;
    imageUrl?: string;
    videoUrl?: string;
    ctwaClid?: string;
  };
  segment: string;
}) {
  const existing = await prisma.contact.findFirst({
    where: { companyId, phone }
  });

  if (existing) {
    return updateWebhookContactContext(existing, profileName, referral);
  }

  try {
    const safeProfileName = previewText(profileName ?? "", 120);
    const referralData = getReferralContactData(referral);
    return await prisma.contact.create({
      data: {
        companyId,
        name: safeProfileName || `WhatsApp ${phone}`,
        phone,
        segment,
        whatsappProfileName: safeProfileName,
        profileSource: safeProfileName ? "WHATSAPP_PROFILE" : "UNKNOWN",
        ...referralData,
        optedIn: true
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      // Current beta schema keeps Contact.phone globally unique. Do not reassign
      // another workspace's contact while provider routing is being hardened.
      return null;
    }

    throw error;
  }
}

async function updateWebhookContactContext(
  contact: {
    id: string;
    name: string;
    phone: string;
    whatsappProfileName: string;
    profileSource: string;
  },
  profileName?: string,
  referral?: {
    sourceType?: string;
    sourceId?: string;
    sourceUrl?: string;
    headline?: string;
    body?: string;
    mediaType?: string;
    imageUrl?: string;
    videoUrl?: string;
    ctwaClid?: string;
  }
) {
  const safeProfileName = previewText(profileName ?? "", 120);
  const data: Prisma.ContactUpdateInput = {
    ...getReferralContactData(referral)
  };

  if (safeProfileName) {
    data.whatsappProfileName = safeProfileName;
    if (!contact.profileSource || contact.profileSource === "UNKNOWN") {
      data.profileSource = "WHATSAPP_PROFILE";
    }

    if (isPlaceholderWhatsAppName(contact.name, contact.phone)) {
      data.name = safeProfileName;
      data.profileSource = "WHATSAPP_PROFILE";
    }
  }

  if (!Object.keys(data).length) {
    return contact;
  }

  return prisma.contact.update({
    where: { id: contact.id },
    data
  });
}

function isPlaceholderWhatsAppName(name: string, phone: string) {
  const normalizedName = name.trim();
  return !normalizedName || normalizedName === `WhatsApp ${phone}` || normalizedName === phone;
}

function getReferralLogData(referral?: {
  sourceType?: string;
  sourceId?: string;
  sourceUrl?: string;
  headline?: string;
  body?: string;
  mediaType?: string;
  imageUrl?: string;
  videoUrl?: string;
  ctwaClid?: string;
}) {
  return {
    referralSourceType: previewText(referral?.sourceType ?? "", 80),
    referralSourceId: previewText(referral?.sourceId ?? "", 120),
    referralSourceUrl: previewText(referral?.sourceUrl ?? "", 500),
    referralHeadline: previewText(referral?.headline ?? "", 180),
    referralBody: previewText(referral?.body ?? "", 280),
    referralMediaType: previewText(referral?.mediaType ?? "", 80),
    referralImageUrl: previewText(referral?.imageUrl ?? "", 500),
    referralVideoUrl: previewText(referral?.videoUrl ?? "", 500),
    referralCtwaClid: previewText(referral?.ctwaClid ?? "", 160)
  };
}

function getReferralContactData(referral?: {
  sourceType?: string;
  sourceId?: string;
  sourceUrl?: string;
  headline?: string;
  body?: string;
  mediaType?: string;
  imageUrl?: string;
  videoUrl?: string;
  ctwaClid?: string;
}) {
  if (!referral) {
    return {};
  }

  return {
    lastReferralSourceType: previewText(referral.sourceType ?? "", 80),
    lastReferralSourceId: previewText(referral.sourceId ?? "", 120),
    lastReferralSourceUrl: previewText(referral.sourceUrl ?? "", 500),
    lastReferralHeadline: previewText(referral.headline ?? "", 180),
    lastReferralBody: previewText(referral.body ?? "", 280),
    lastReferralMediaType: previewText(referral.mediaType ?? "", 80),
    lastReferralImageUrl: previewText(referral.imageUrl ?? "", 500),
    lastReferralVideoUrl: previewText(referral.videoUrl ?? "", 500),
    lastReferralCtwaClid: previewText(referral.ctwaClid ?? "", 160),
    lastReferralAt: new Date()
  };
}

function withWhatsAppRoutingMetadata(payload: Prisma.InputJsonValue, routing: ProviderRoutingResult): Prisma.InputJsonValue {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {
      provider: "whatsapp",
      routing: safeRoutingMetadata(routing)
    };
  }

  return {
    ...payload,
    routing: safeRoutingMetadata(routing)
  };
}

function safeRoutingMetadata(routing: ProviderRoutingResult) {
  const providerIds = routing.providerIds as { phoneNumberId?: string; businessAccountId?: string; from?: string };
  return {
    routedBy: routing.routedBy,
    strictMode: routing.strictMode,
    matched: routing.matched,
    whatsappPhoneNumberIdPresent: Boolean(providerIds.phoneNumberId),
    whatsappBusinessAccountIdPresent: Boolean(providerIds.businessAccountId),
    senderPresent: Boolean(providerIds.from)
  };
}

function unmatchedWhatsAppPayload(routing: ProviderRoutingResult): Prisma.InputJsonValue {
  return {
    provider: "whatsapp",
    eventType: "unmatched_provider",
    routing: safeRoutingMetadata(routing),
    note: "Strict provider routing is enabled. Unmatched WhatsApp webhook was acknowledged but not processed into a workspace.",
    receivedAt: new Date().toISOString()
  };
}

async function getWebhookCompany() {
  // GET verification usually has no provider IDs, so keep current beta/default fallback.
  return getCurrentCompany();
}
