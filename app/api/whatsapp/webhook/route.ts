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
        name: `WhatsApp ${message.from}`,
        segment: "WhatsApp Inbox"
      });

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
          mediaId: message.media?.id ?? "",
          mediaType: message.media?.type ?? "",
          mediaMimeType: message.media?.mimeType ?? "",
          mediaSha256: message.media?.sha256 ?? "",
          mediaFilename: message.media?.filename ?? ""
        }
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
      return `[${message.type} message]`;
  }
}

async function findOrCreateWebhookContact({
  companyId,
  phone,
  name,
  segment
}: {
  companyId: string;
  phone: string;
  name: string;
  segment: string;
}) {
  const existing = await prisma.contact.findFirst({
    where: { companyId, phone }
  });

  if (existing) {
    return existing;
  }

  try {
    return await prisma.contact.create({
      data: {
        companyId,
        name,
        phone,
        segment,
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
