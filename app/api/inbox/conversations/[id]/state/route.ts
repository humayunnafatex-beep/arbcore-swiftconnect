import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, handleApiError } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { formatChangeSummary, recordActivity, safeActivityLabel } from "@/lib/activity-log";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const validConversationChannels = ["WHATSAPP", "MESSENGER"] as const;
const statusValues = ["OPEN", "PENDING", "CLOSED"] as const;
const priorityValues = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;
const quickLabelValues = ["HOT_LEAD", "NEED_FOLLOW_UP", "PAYMENT_PENDING", "ORDER_ISSUE", "GENERAL", ""] as const;

const stateSchema = z.object({
  status: z.enum(statusValues).optional(),
  assignedToId: z.string().trim().min(1).nullable().optional(),
  internalNote: z.string().max(2000).optional(),
  followUpAt: z.string().trim().nullable().optional(),
  followUpDone: z.boolean().optional(),
  isRead: z.boolean().optional(),
  isStarred: z.boolean().optional(),
  priority: z.enum(priorityValues).optional(),
  quickLabel: z.enum(quickLabelValues).optional()
});

type ConversationChannel = (typeof validConversationChannels)[number];
type ConversationStatus = (typeof statusValues)[number];

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { context } = await requirePermission("inbox.manage");
    const { company } = context;
    const conversation = decodeConversationId(params.id);
    const parsed = stateSchema.safeParse(await request.json().catch(() => null));

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Conversation status or assignee is invalid." },
        { status: 400 }
      );
    }

    const assignedToProvided = Object.prototype.hasOwnProperty.call(parsed.data, "assignedToId");
    const followUpAtProvided = Object.prototype.hasOwnProperty.call(parsed.data, "followUpAt");
    const assignedToId = parsed.data.assignedToId ?? null;
    const followUpAt = parseFollowUpAt(parsed.data.followUpAt);

    if (assignedToId) {
      const user = await prisma.user.findFirst({
        where: {
          id: assignedToId,
          companyId: company.id,
          isActive: true
        },
        select: { id: true }
      });

      if (!user) {
        return NextResponse.json(
          { success: false, error: "Selected assignee was not found in this workspace." },
          { status: 400 }
        );
      }
    }

    const current = await prisma.conversationState.findUnique({
      where: {
        companyId_channel_contactKey: {
          companyId: company.id,
          channel: conversation.channel,
          contactKey: conversation.contactKey
        }
      },
      select: {
        status: true,
        assignedToId: true,
        internalNote: true,
        followUpAt: true,
        followUpDone: true,
        isRead: true,
        isStarred: true,
        priority: true,
        quickLabel: true
      }
    });
    const nextStatus = parsed.data.status ?? normalizeConversationStatus(current?.status);
    const updateData = {
      status: nextStatus,
      ...(assignedToProvided ? { assignedToId } : {}),
      ...("internalNote" in parsed.data ? { internalNote: parsed.data.internalNote?.trim() ?? "" } : {}),
      ...(followUpAtProvided ? { followUpAt } : {}),
      ...("followUpDone" in parsed.data ? { followUpDone: parsed.data.followUpDone ?? false } : {}),
      ...("isRead" in parsed.data ? { isRead: parsed.data.isRead ?? false, lastReadAt: parsed.data.isRead ? new Date() : null } : {}),
      ...("isStarred" in parsed.data ? { isStarred: parsed.data.isStarred ?? false } : {}),
      ...("priority" in parsed.data ? { priority: parsed.data.priority ?? "NORMAL" } : {}),
      ...("quickLabel" in parsed.data ? { quickLabel: parsed.data.quickLabel ?? "" } : {})
    };

    const state = await prisma.conversationState.upsert({
      where: {
        companyId_channel_contactKey: {
          companyId: company.id,
          channel: conversation.channel,
          contactKey: conversation.contactKey
        }
      },
      update: updateData,
      create: {
        companyId: company.id,
        channel: conversation.channel,
        contactKey: conversation.contactKey,
        status: nextStatus,
        assignedToId,
        internalNote: parsed.data.internalNote?.trim() ?? "",
        followUpAt,
        followUpDone: parsed.data.followUpDone ?? false,
        isRead: parsed.data.isRead ?? false,
        lastReadAt: parsed.data.isRead ? new Date() : null,
        isStarred: parsed.data.isStarred ?? false,
        priority: parsed.data.priority ?? "NORMAL",
        quickLabel: parsed.data.quickLabel ?? ""
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
    });

    await recordActivity({
      companyId: company.id,
      action: getConversationAction(parsed.data),
      entityType: "CONVERSATION",
      entityId: params.id,
      entityLabel: safeActivityLabel(conversation.channel, conversation.contactKey),
      summary: formatChangeSummary(current, state, ["status", "assignedToId", "internalNote", "followUpAt", "followUpDone", "isRead", "isStarred", "priority", "quickLabel"]),
      metadataSummary: `Status: ${normalizeConversationStatus(state.status)}; Priority: ${normalizePriority(state.priority)}`
    });

    return NextResponse.json({
      success: true,
      data: {
        status: normalizeConversationStatus(state.status),
        assignedTo: state.assignedTo,
        internalNote: state.internalNote,
        followUpAt: state.followUpAt?.toISOString() ?? null,
        followUpDone: state.followUpDone,
        followUpStatus: getFollowUpStatus(state.followUpAt, state.followUpDone),
        isRead: state.isRead,
        isStarred: state.isStarred,
        priority: normalizePriority(state.priority),
        quickLabel: normalizeQuickLabel(state.quickLabel),
        lastReadAt: state.lastReadAt?.toISOString() ?? null
      }
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return handleApiError(error);
    }

    console.error("Inbox conversation state PATCH error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to update inbox conversation state." },
      { status: 500 }
    );
  }
}

function getConversationAction(data: z.infer<typeof stateSchema>) {
  if ("status" in data) return "CONVERSATION_STATUS_UPDATED";
  if ("assignedToId" in data) return "CONVERSATION_ASSIGNED";
  if ("isRead" in data) return "CONVERSATION_READ_UPDATED";
  if ("priority" in data) return "CONVERSATION_PRIORITY_UPDATED";
  if ("quickLabel" in data) return "CONVERSATION_LABEL_UPDATED";
  if ("followUpAt" in data || "followUpDone" in data) return "CONVERSATION_FOLLOWUP_UPDATED";
  if ("internalNote" in data) return "CONVERSATION_NOTE_UPDATED";
  return "CONVERSATION_UPDATED";
}

function normalizePriority(value: string | null | undefined): (typeof priorityValues)[number] {
  return priorityValues.includes((value ?? "") as (typeof priorityValues)[number])
    ? value as (typeof priorityValues)[number]
    : "NORMAL";
}

function normalizeQuickLabel(value: string | null | undefined): (typeof quickLabelValues)[number] {
  return quickLabelValues.includes((value ?? "") as (typeof quickLabelValues)[number])
    ? value as (typeof quickLabelValues)[number]
    : "";
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

function normalizeConversationStatus(value: string | null | undefined): ConversationStatus {
  return value === "PENDING" || value === "CLOSED" ? value : "OPEN";
}

function parseFollowUpAt(value: string | null | undefined) {
  if (value === undefined) return undefined;
  if (value === null || !value.trim()) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, "INVALID_FOLLOW_UP", "Follow-up date must be a valid date.");
  }

  return date;
}

function getFollowUpStatus(followUpAt: Date | null, followUpDone: boolean): "NONE" | "DUE" | "UPCOMING" | "DONE" {
  if (followUpDone) return "DONE";
  if (!followUpAt) return "NONE";
  return followUpAt.getTime() <= Date.now() ? "DUE" : "UPCOMING";
}
