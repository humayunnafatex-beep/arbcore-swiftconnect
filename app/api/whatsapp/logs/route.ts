import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ApiError, handleApiError } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const channels = ["ALL", "WHATSAPP", "MESSENGER"] as const;
const directions = ["ALL", "INBOUND", "OUTBOUND"] as const;
const statuses = ["ALL", "SENT", "FAILED", "RECEIVED", "ATTEMPTED"] as const;

export async function GET(request: Request) {
  try {
    const { context } = await requirePermission("messages.viewLogs");
    const { company } = context;
    const { searchParams } = new URL(request.url);
    const channel = parseOption(searchParams.get("channel"), channels, "ALL");
    const direction = parseOption(searchParams.get("direction"), directions, "ALL");
    const status = parseOption(searchParams.get("status"), statuses, "ALL");
    const search = searchParams.get("search")?.trim();
    const limit = parseLimit(searchParams.get("limit"));
    const where = buildMessageWhere({
      companyId: company.id,
      channel,
      direction,
      status,
      search
    });

    const [messages, webhookEvents] = await Promise.all([
      prisma.messageLog.findMany({
        where,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { contact: true, whatsappAccount: true }
      }),
      prisma.webhookEvent.findMany({
        where: { companyId: company.id, provider: { in: ["whatsapp", "messenger"] } },
        take: 20,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          provider: true,
          eventType: true,
          payload: true,
          createdAt: true
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        messages: messages.map((message) => ({
          id: message.id,
          direction: message.direction,
          channel: message.channel,
          phone: message.contact?.phone ?? message.whatsappAccount?.phoneNumber ?? "",
          bodyPreview: previewText(message.body),
          status: message.status,
          providerMessageId: message.providerMessageId,
          providerMessageType: message.providerMessageType,
          providerMetadataSummary: message.providerMetadataSummary,
          providerStatus: message.status,
          errorMessage: message.errorMessage,
          mediaId: message.mediaId,
          mediaType: message.mediaType,
          mediaMimeType: message.mediaMimeType,
          mediaFilename: message.mediaFilename,
          referralSourceType: message.referralSourceType,
          referralSourceId: message.referralSourceId,
          referralSourceUrl: message.referralSourceUrl,
          referralHeadline: message.referralHeadline,
          referralBody: message.referralBody,
          referralMediaType: message.referralMediaType,
          referralImageUrl: message.referralImageUrl,
          referralVideoUrl: message.referralVideoUrl,
          referralCtwaClid: message.referralCtwaClid,
          createdAt: message.createdAt
        })),
        webhookEvents: webhookEvents.map((event) => ({
          id: event.id,
          provider: event.provider,
          eventType: event.eventType ?? "unknown",
          summary: summarizeWebhookPayload(event.payload),
          createdAt: event.createdAt
        }))
      }
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return handleApiError(error);
    }

    console.error("WhatsApp logs GET error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to load WhatsApp logs." },
      { status: 500 }
    );
  }
}

function buildMessageWhere({
  companyId,
  channel,
  direction,
  status,
  search
}: {
  companyId: string;
  channel: (typeof channels)[number];
  direction: (typeof directions)[number];
  status: (typeof statuses)[number];
  search?: string;
}): Prisma.MessageLogWhereInput {
  return {
    companyId,
    ...(channel === "ALL" ? {} : { channel }),
    ...(direction === "ALL" ? {} : { direction }),
    ...(status === "ALL"
      ? {}
      : status === "ATTEMPTED"
        ? { status: "QUEUED" }
        : { status }),
    ...(search
      ? {
          OR: [
            { body: { contains: search, mode: "insensitive" } },
            { providerMessageId: { contains: search, mode: "insensitive" } },
            { providerMessageType: { contains: search, mode: "insensitive" } },
            { providerMetadataSummary: { contains: search, mode: "insensitive" } },
            { referralSourceType: { contains: search, mode: "insensitive" } },
            { referralSourceId: { contains: search, mode: "insensitive" } },
            { referralHeadline: { contains: search, mode: "insensitive" } },
            { referralBody: { contains: search, mode: "insensitive" } },
            { referralCtwaClid: { contains: search, mode: "insensitive" } },
            { contact: { phone: { contains: search, mode: "insensitive" } } },
            { whatsappAccount: { phoneNumber: { contains: search, mode: "insensitive" } } }
          ]
        }
      : {})
  };
}

function parseOption<const T extends readonly string[]>(value: string | null, options: T, fallback: T[number]): T[number] {
  const normalized = value?.trim().toUpperCase();
  return options.includes(normalized ?? "") ? normalized as T[number] : fallback;
}

function parseLimit(value: string | null) {
  const parsed = Number(value ?? 50);
  if (!Number.isFinite(parsed)) return 50;
  return Math.min(Math.max(Math.floor(parsed), 1), 100);
}

function previewText(value: string, maxLength = 140) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3)}...`;
}

function summarizeWebhookPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return "Webhook event received.";
  }

  const value = payload as {
    provider?: string;
    messageCount?: number;
    senderCount?: number;
    entry?: Array<{
      changes?: Array<{
        field?: string;
        value?: {
          messages?: unknown[];
          statuses?: unknown[];
          contacts?: unknown[];
        };
      }>;
    }>;
  };

  if (value.provider === "messenger") {
    const messageCount = value.messageCount ?? 0;
    const senderCount = value.senderCount ?? 0;
    return messageCount
      ? `Messenger webhook received: ${messageCount} message event${messageCount === 1 ? "" : "s"} from ${senderCount} sender${senderCount === 1 ? "" : "s"}.`
      : "Messenger webhook event received.";
  }

  const changes = value.entry?.flatMap((entry) => entry.changes ?? []) ?? [];
  const messageCount = changes.reduce((total, change) => total + (change.value?.messages?.length ?? 0), 0);
  const statusCount = changes.reduce((total, change) => total + (change.value?.statuses?.length ?? 0), 0);
  const contactCount = changes.reduce((total, change) => total + (change.value?.contacts?.length ?? 0), 0);
  const messageTypes = changes
    .flatMap((change) => change.value?.messages ?? [])
    .map((message) => getWebhookMessageType(message))
    .filter(Boolean);
  const unsupportedCount = messageTypes.filter((type) => isUnsupportedWhatsAppType(type)).length;
  const typeSummary = summarizeMessageTypes(messageTypes);
  const fields = [...new Set(changes.map((change) => change.field).filter(Boolean))].join(", ");
  const parts = [
    fields ? `fields: ${fields}` : null,
    messageCount ? `${messageCount} message event${messageCount === 1 ? "" : "s"}` : null,
    typeSummary ? `types: ${typeSummary}` : null,
    unsupportedCount ? `${unsupportedCount} unsupported message${unsupportedCount === 1 ? "" : "s"}` : null,
    statusCount ? `${statusCount} status event${statusCount === 1 ? "" : "s"}` : null,
    contactCount ? `${contactCount} contact${contactCount === 1 ? "" : "s"}` : null
  ].filter(Boolean);

  return parts.length ? parts.join("; ") : "Webhook event received.";
}

function getWebhookMessageType(message: unknown) {
  return message && typeof message === "object" && "type" in message && typeof message.type === "string"
    ? message.type
    : "";
}

function summarizeMessageTypes(types: string[]) {
  const counts = new Map<string, number>();
  for (const type of types) {
    counts.set(type, (counts.get(type) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([type, count]) => `${type}=${count}`)
    .join(", ");
}

function isUnsupportedWhatsAppType(type: string) {
  return !["text", "audio", "image", "document", "video"].includes(type);
}
