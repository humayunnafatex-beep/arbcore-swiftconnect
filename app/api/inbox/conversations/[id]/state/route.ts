import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, handleApiError } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const validConversationChannels = ["WHATSAPP", "MESSENGER"] as const;
const statusValues = ["OPEN", "PENDING", "CLOSED"] as const;

const stateSchema = z.object({
  status: z.enum(statusValues).optional(),
  assignedToId: z.string().trim().min(1).nullable().optional()
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
    const assignedToId = parsed.data.assignedToId ?? null;

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
      select: { status: true }
    });
    const nextStatus = parsed.data.status ?? normalizeConversationStatus(current?.status);

    const state = await prisma.conversationState.upsert({
      where: {
        companyId_channel_contactKey: {
          companyId: company.id,
          channel: conversation.channel,
          contactKey: conversation.contactKey
        }
      },
      update: {
        status: nextStatus,
        ...(assignedToProvided ? { assignedToId } : {})
      },
      create: {
        companyId: company.id,
        channel: conversation.channel,
        contactKey: conversation.contactKey,
        status: nextStatus,
        assignedToId
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

    return NextResponse.json({
      success: true,
      data: {
        status: normalizeConversationStatus(state.status),
        assignedTo: state.assignedTo
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
