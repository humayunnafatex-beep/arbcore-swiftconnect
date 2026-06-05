import { NextResponse } from "next/server";
import { ApiError, handleApiError } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { formatChangeSummary, recordActivity, safeActivityLabel } from "@/lib/activity-log";
import { prisma } from "@/lib/prisma";
import { validateSavedReplyInput } from "@/lib/saved-reply-input";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = {
  params: { id: string };
};

export async function GET(_request: Request, { params }: Context) {
  try {
    const { context } = await requirePermission("savedReplies.view");
    const reply = await prisma.savedReply.findFirst({
      where: { id: params.id, companyId: context.company.id }
    });

    if (!reply) {
      return NextResponse.json({ success: false, error: "Saved reply was not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { reply } });
  } catch (error) {
    if (error instanceof ApiError) return handleApiError(error);
    console.error("Saved reply GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to load saved reply." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    const { context } = await requirePermission("savedReplies.manage");
    const existing = await prisma.savedReply.findFirst({
      where: { id: params.id, companyId: context.company.id },
      select: { id: true, title: true, category: true, shortcut: true, channel: true, status: true }
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Saved reply was not found." }, { status: 404 });
    }

    const validation = validateSavedReplyInput(await request.json().catch(() => ({})), { partial: true });

    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    const reply = await prisma.savedReply.update({
      where: { id: params.id },
      data: validation.data
    });

    await recordActivity({
      companyId: context.company.id,
      action: "SAVED_REPLY_UPDATED",
      entityType: "SAVED_REPLY",
      entityId: reply.id,
      entityLabel: safeActivityLabel(reply.title, reply.shortcut),
      summary: formatChangeSummary(existing, reply, ["title", "category", "shortcut", "channel", "status"]),
      metadataSummary: `Category: ${reply.category}; Channel: ${reply.channel}; Status: ${reply.status}`
    });

    return NextResponse.json({ success: true, data: { reply } });
  } catch (error) {
    if (error instanceof ApiError) return handleApiError(error);
    console.error("Saved reply PATCH error:", error);
    return NextResponse.json({ success: false, error: "Failed to update saved reply." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    const { context } = await requirePermission("savedReplies.manage");
    const existing = await prisma.savedReply.findFirst({
      where: { id: params.id, companyId: context.company.id },
      select: { id: true, title: true, shortcut: true }
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Saved reply was not found." }, { status: 404 });
    }

    const reply = await prisma.savedReply.update({
      where: { id: params.id },
      data: { status: "ARCHIVED" }
    });

    await recordActivity({
      companyId: context.company.id,
      action: "SAVED_REPLY_ARCHIVED",
      entityType: "SAVED_REPLY",
      entityId: reply.id,
      entityLabel: safeActivityLabel(existing.title, existing.shortcut),
      summary: "Archived saved reply.",
      metadataSummary: `Status: ${reply.status}`
    });

    return NextResponse.json({ success: true, data: { reply } });
  } catch (error) {
    if (error instanceof ApiError) return handleApiError(error);
    console.error("Saved reply DELETE error:", error);
    return NextResponse.json({ success: false, error: "Failed to archive saved reply." }, { status: 500 });
  }
}
