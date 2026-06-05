import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, handleApiError } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { formatChangeSummary, recordActivity, safeActivityLabel } from "@/lib/activity-log";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const statuses = ["ALL", "OVERDUE", "TODAY", "UPCOMING", "DONE"] as const;
const sources = ["ALL", "CONVERSATION", "ORDER"] as const;

const updateSchema = z.object({
  sourceType: z.enum(["CONVERSATION", "ORDER"]),
  id: z.string().trim().min(1),
  followUpAt: z.string().trim().nullable().optional(),
  followUpDone: z.boolean().optional()
});

export async function GET(request: Request) {
  try {
    const { context } = await requirePermission("dashboard.view");
    const { searchParams } = new URL(request.url);
    const status = parseOption(searchParams.get("status"), statuses, "ALL");
    const source = parseOption(searchParams.get("source"), sources, "ALL");
    const search = searchParams.get("search")?.trim();
    const limit = parseLimit(searchParams.get("limit"));
    const now = new Date();
    const todayStart = startOfDay(now);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const [conversationItems, orderItems] = await Promise.all([
      source === "ORDER" ? Promise.resolve([]) : loadConversationFollowUps(context.company.id, limit),
      source === "CONVERSATION" ? Promise.resolve([]) : loadOrderFollowUps(context.company.id, limit)
    ]);
    const items = [...conversationItems, ...orderItems]
      .map((item) => ({ ...item, bucket: getFollowUpBucket(item.followUpAt, item.followUpDone, todayStart, tomorrowStart) }))
      .filter((item) => status === "ALL" || item.bucket === status)
      .filter((item) => !search || matchesSearch(item, search))
      .sort((a, b) => sortFollowUps(a, b))
      .slice(0, limit);

    const allForCounts = [...conversationItems, ...orderItems].map((item) => ({
      ...item,
      bucket: getFollowUpBucket(item.followUpAt, item.followUpDone, todayStart, tomorrowStart)
    }));

    return NextResponse.json({
      success: true,
      data: {
        items,
        counts: {
          overdue: allForCounts.filter((item) => item.bucket === "OVERDUE").length,
          today: allForCounts.filter((item) => item.bucket === "TODAY").length,
          upcoming: allForCounts.filter((item) => item.bucket === "UPCOMING").length,
          done: allForCounts.filter((item) => item.bucket === "DONE").length
        }
      }
    });
  } catch (error) {
    if (error instanceof ApiError) return handleApiError(error);
    console.error("Follow-ups GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to load follow-up queue." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = updateSchema.safeParse(await request.json().catch(() => null));

    if (!payload.success) {
      return NextResponse.json({ success: false, error: "Follow-up update is invalid." }, { status: 400 });
    }

    const permission = payload.data.sourceType === "ORDER" ? "orders.manage" : "inbox.manage";
    const { context } = await requirePermission(permission);
    const followUpAt = parseOptionalDate(payload.data.followUpAt);

    if (payload.data.sourceType === "ORDER") {
      const existing = await prisma.order.findFirst({ where: { id: payload.data.id, companyId: context.company.id } });
      if (!existing) throw new ApiError(404, "ORDER_NOT_FOUND", "Order was not found.");

      const order = await prisma.order.update({
        where: { id: existing.id },
        data: {
          ...(payload.data.followUpAt !== undefined ? { followUpAt } : {}),
          ...(payload.data.followUpDone !== undefined ? { followUpDone: payload.data.followUpDone } : {})
        },
        include: { contact: { select: { id: true, name: true, phone: true } } }
      });

      await recordActivity({
        companyId: context.company.id,
        action: "ORDER_FOLLOWUP_UPDATED",
        entityType: "ORDER",
        entityId: order.id,
        entityLabel: safeActivityLabel(order.orderNumber, order.customerName || order.customerPhone),
        summary: formatChangeSummary(existing, order, ["followUpAt", "followUpDone"]),
        metadataSummary: `Follow-up: ${order.followUpDone ? "DONE" : order.followUpAt ? order.followUpAt.toISOString() : "NONE"}`
      });

      return NextResponse.json({ success: true, data: { item: mapOrderFollowUp(order) } });
    }

    const existing = await prisma.conversationState.findFirst({ where: { id: payload.data.id, companyId: context.company.id } });
    if (!existing) throw new ApiError(404, "CONVERSATION_NOT_FOUND", "Conversation follow-up was not found.");

    const state = await prisma.conversationState.update({
      where: { id: existing.id },
      data: {
        ...(payload.data.followUpAt !== undefined ? { followUpAt } : {}),
        ...(payload.data.followUpDone !== undefined ? { followUpDone: payload.data.followUpDone } : {})
      }
    });

    await recordActivity({
      companyId: context.company.id,
      action: "CONVERSATION_FOLLOWUP_UPDATED",
      entityType: "CONVERSATION",
      entityId: encodeConversationId(state.channel, state.contactKey),
      entityLabel: safeActivityLabel(state.channel, state.contactKey),
      summary: formatChangeSummary(existing, state, ["followUpAt", "followUpDone"]),
      metadataSummary: `Follow-up: ${state.followUpDone ? "DONE" : state.followUpAt ? state.followUpAt.toISOString() : "NONE"}`
    });

    return NextResponse.json({ success: true, data: { item: mapConversationFollowUp(state) } });
  } catch (error) {
    if (error instanceof ApiError) return handleApiError(error);
    console.error("Follow-ups PATCH error:", error);
    return NextResponse.json({ success: false, error: "Failed to update follow-up." }, { status: 500 });
  }
}

async function loadConversationFollowUps(companyId: string, limit: number) {
  const states = await prisma.conversationState.findMany({
    where: {
      companyId,
      OR: [{ followUpAt: { not: null } }, { followUpDone: true }]
    },
    take: Math.min(limit * 2, 500),
    orderBy: [{ followUpDone: "asc" }, { followUpAt: "asc" }]
  });
  const contacts = await prisma.contact.findMany({
    where: { companyId },
    select: { id: true, name: true, phone: true, whatsappProfileName: true }
  });
  const contactMap = new Map(contacts.map((contact) => [normalizePhoneForMatch(contact.phone), contact]));

  return states.map((state) => {
    const contact = state.channel === "WHATSAPP" ? contactMap.get(normalizePhoneForMatch(state.contactKey)) : null;
    return mapConversationFollowUp(state, contact);
  });
}

async function loadOrderFollowUps(companyId: string, limit: number) {
  const orders = await prisma.order.findMany({
    where: {
      companyId,
      OR: [{ followUpAt: { not: null } }, { followUpDone: true }]
    },
    take: Math.min(limit * 2, 500),
    orderBy: [{ followUpDone: "asc" }, { followUpAt: "asc" }],
    include: { contact: { select: { id: true, name: true, phone: true } } }
  });

  return orders.map(mapOrderFollowUp);
}

function mapConversationFollowUp(
  state: Prisma.ConversationStateGetPayload<Record<string, never>>,
  contact?: { id: string; name: string; phone: string; whatsappProfileName: string } | null
) {
  const conversationId = encodeConversationId(state.channel, state.contactKey);
  return {
    id: state.id,
    sourceType: "CONVERSATION" as const,
    sourceId: state.id,
    conversationId,
    customerName: contact?.name || contact?.whatsappProfileName || state.contactKey,
    contactKey: state.contactKey,
    channel: state.channel,
    followUpAt: state.followUpAt?.toISOString() ?? null,
    followUpDone: state.followUpDone,
    priority: state.priority || "NORMAL",
    status: state.status || "OPEN",
    relatedLabel: `${state.channel} conversation`,
    inboxHref: `/inbox?channel=${encodeURIComponent(state.channel)}&search=${encodeURIComponent(state.contactKey)}`,
    orderHref: null
  };
}

function mapOrderFollowUp(order: Prisma.OrderGetPayload<{ include: { contact: { select: { id: true; name: true; phone: true } } } }>) {
  return {
    id: order.id,
    sourceType: "ORDER" as const,
    sourceId: order.id,
    conversationId: null,
    customerName: order.customerName || order.contact?.name || order.customerPhone || order.customerKey,
    contactKey: order.customerPhone || order.contact?.phone || order.customerKey,
    channel: order.channel,
    followUpAt: order.followUpAt?.toISOString() ?? null,
    followUpDone: order.followUpDone,
    priority: "",
    status: order.orderStatus,
    relatedLabel: `${order.orderNumber || "Order"}${order.modelName ? ` - ${order.modelName}` : ""}`,
    inboxHref: order.customerKey || order.customerPhone
      ? `/inbox?channel=${encodeURIComponent(order.channel)}&search=${encodeURIComponent(order.customerKey || order.customerPhone)}&orderId=${encodeURIComponent(order.id)}`
      : null,
    orderHref: `/orders?search=${encodeURIComponent(order.orderNumber || order.customerPhone || order.id)}`
  };
}

function getFollowUpBucket(followUpAt: string | null, followUpDone: boolean, todayStart: Date, tomorrowStart: Date) {
  if (followUpDone) return "DONE";
  if (!followUpAt) return "UPCOMING";
  const date = new Date(followUpAt);
  if (date.getTime() < todayStart.getTime()) return "OVERDUE";
  if (date.getTime() < tomorrowStart.getTime()) return "TODAY";
  return "UPCOMING";
}

function sortFollowUps(a: { bucket: string; followUpAt: string | null }, b: { bucket: string; followUpAt: string | null }) {
  const bucketOrder = new Map([["OVERDUE", 0], ["TODAY", 1], ["UPCOMING", 2], ["DONE", 3]]);
  const bucketDelta = (bucketOrder.get(a.bucket) ?? 9) - (bucketOrder.get(b.bucket) ?? 9);
  if (bucketDelta !== 0) return bucketDelta;
  return new Date(a.followUpAt ?? 0).getTime() - new Date(b.followUpAt ?? 0).getTime();
}

function matchesSearch(item: { customerName: string; contactKey: string; relatedLabel: string; channel: string }, search: string) {
  const haystack = `${item.customerName} ${item.contactKey} ${item.relatedLabel} ${item.channel}`.toLowerCase();
  return haystack.includes(search.toLowerCase());
}

function parseOption<const T extends readonly string[]>(value: string | null, options: T, fallback: T[number]): T[number] {
  const normalized = value?.trim().toUpperCase();
  return options.includes(normalized ?? "") ? normalized as T[number] : fallback;
}

function parseLimit(value: string | null) {
  const parsed = Number(value ?? 100);
  if (!Number.isFinite(parsed)) return 100;
  return Math.min(Math.max(Math.floor(parsed), 1), 300);
}

function parseOptionalDate(value: string | null | undefined) {
  if (value === null) return null;
  if (value === undefined || !value.trim()) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new ApiError(400, "INVALID_FOLLOW_UP_AT", "Follow-up date is invalid.");
  }
  return parsed;
}

function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function encodeConversationId(channel: string, contactKey: string) {
  return Buffer.from(JSON.stringify({ channel, contactKey })).toString("base64url");
}

function normalizePhoneForMatch(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "");
}
