import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ApiError, handleApiError } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const channels = ["ALL", "WHATSAPP", "MESSENGER"] as const;
const directions = ["ALL", "INBOUND", "OUTBOUND"] as const;
const statuses = ["ALL", "OPEN", "PENDING", "CLOSED"] as const;
const validConversationChannels = ["WHATSAPP", "MESSENGER"] as const;

export async function GET(request: Request) {
  try {
    const { context } = await requirePermission("messages.viewLogs");
    const { company } = context;
    const { searchParams } = new URL(request.url);
    const channel = parseOption(searchParams.get("channel"), channels, "ALL");
    const direction = parseOption(searchParams.get("direction"), directions, "ALL");
    const status = parseOption(searchParams.get("status"), statuses, "ALL");
    const assignedTo = searchParams.get("assignedTo")?.trim() || "ALL";
    const search = searchParams.get("search")?.trim();
    const limit = parseLimit(searchParams.get("limit"));
    const where = buildMessageWhere({ companyId: company.id, channel, direction, search });

    const messages = await prisma.messageLog.findMany({
      where,
      take: Math.min(Math.max(limit * 8, 100), 500),
      orderBy: { createdAt: "desc" },
      include: { contact: true, whatsappAccount: true }
    });

    const conversations = new Map<string, ConversationSummary>();

    for (const message of messages) {
      const normalizedChannel = normalizeChannel(message.channel);
      const contactKey = getContactKey(message);
      const mapKey = `${normalizedChannel}:${contactKey}`;
      const existing = conversations.get(mapKey);

      if (!existing) {
        conversations.set(mapKey, {
          id: encodeConversationId(normalizedChannel, contactKey),
          channel: normalizedChannel,
          contactKey,
          displayName: getDisplayName(message),
          lastMessagePreview: previewText(message.body),
          lastDirection: message.direction,
          lastStatus: message.status,
          lastMessageAt: message.createdAt.toISOString(),
          status: "OPEN",
          assignedTo: null,
          messageCount: 1,
          failedCount: message.status === "FAILED" ? 1 : 0,
          inboundCount: message.direction === "INBOUND" ? 1 : 0,
          outboundCount: message.direction === "OUTBOUND" ? 1 : 0
        });
        continue;
      }

      existing.messageCount += 1;
      existing.failedCount += message.status === "FAILED" ? 1 : 0;
      existing.inboundCount += message.direction === "INBOUND" ? 1 : 0;
      existing.outboundCount += message.direction === "OUTBOUND" ? 1 : 0;
    }

    const conversationItems = Array.from(conversations.values());
    const states = conversationItems.length
      ? await prisma.conversationState.findMany({
          where: {
            companyId: company.id,
            OR: conversationItems.map((conversation) => ({
              channel: conversation.channel,
              contactKey: conversation.contactKey
            }))
          },
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          }
        })
      : [];
    const stateMap = new Map(states.map((state) => [`${state.channel}:${state.contactKey}`, state]));

    const filteredConversations = conversationItems
      .map((conversation) => {
        const state = stateMap.get(`${conversation.channel}:${conversation.contactKey}`);

        return {
          ...conversation,
          status: normalizeConversationStatus(state?.status),
          assignedTo: state?.assignedTo ?? null
        };
      })
      .filter((conversation) => status === "ALL" || conversation.status === status)
      .filter((conversation) => {
        if (assignedTo === "ALL") return true;
        if (assignedTo === "UNASSIGNED") return !conversation.assignedTo;
        return conversation.assignedTo?.id === assignedTo;
      });

    return NextResponse.json({
      success: true,
      data: {
        conversations: filteredConversations.slice(0, limit)
      }
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return handleApiError(error);
    }

    console.error("Inbox conversations GET error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to load inbox conversations." },
      { status: 500 }
    );
  }
}

type ConversationChannel = (typeof validConversationChannels)[number];

type MessageWithRelations = Prisma.MessageLogGetPayload<{
  include: { contact: true; whatsappAccount: true };
}>;

type ConversationSummary = {
  id: string;
  channel: ConversationChannel;
  contactKey: string;
  displayName: string | null;
  lastMessagePreview: string;
  lastDirection: "INBOUND" | "OUTBOUND";
  lastStatus: string;
  lastMessageAt: string;
  status: "OPEN" | "PENDING" | "CLOSED";
  assignedTo: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  messageCount: number;
  failedCount: number;
  inboundCount: number;
  outboundCount: number;
};

function buildMessageWhere({
  companyId,
  channel,
  direction,
  search
}: {
  companyId: string;
  channel: (typeof channels)[number];
  direction: (typeof directions)[number];
  search?: string;
}): Prisma.MessageLogWhereInput {
  return {
    companyId,
    ...(channel === "ALL" ? { channel: { in: [...validConversationChannels] } } : { channel }),
    ...(direction === "ALL" ? {} : { direction }),
    ...(search
      ? {
          OR: [
            { body: { contains: search, mode: "insensitive" } },
            { providerMessageId: { contains: search, mode: "insensitive" } },
            { contact: { name: { contains: search, mode: "insensitive" } } },
            { contact: { phone: { contains: search, mode: "insensitive" } } },
            { whatsappAccount: { businessName: { contains: search, mode: "insensitive" } } },
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

function normalizeChannel(value: string): ConversationChannel {
  return value === "MESSENGER" ? "MESSENGER" : "WHATSAPP";
}

function normalizeConversationStatus(value: string | null | undefined): "OPEN" | "PENDING" | "CLOSED" {
  return value === "PENDING" || value === "CLOSED" ? value : "OPEN";
}

function getContactKey(message: MessageWithRelations) {
  return message.contact?.phone ?? message.whatsappAccount?.phoneNumber ?? message.providerMessageId ?? "unknown";
}

function getDisplayName(message: MessageWithRelations) {
  return message.contact?.name ?? message.whatsappAccount?.businessName ?? null;
}

function previewText(value: string, maxLength = 120) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3)}...`;
}

function encodeConversationId(channel: ConversationChannel, contactKey: string) {
  return Buffer.from(JSON.stringify({ channel, contactKey }), "utf8").toString("base64url");
}
