import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ApiError, handleApiError } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";
import {
  normalizeSavedReplyCategory,
  normalizeSavedReplyChannel,
  normalizeSavedReplyStatus,
  validateSavedReplyInput
} from "@/lib/saved-reply-input";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { context } = await requirePermission("savedReplies.view");
    const { company } = context;
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category")?.trim();
    const channel = searchParams.get("channel")?.trim();
    const status = searchParams.get("status")?.trim();
    const search = searchParams.get("search")?.trim();
    const limit = parseLimit(searchParams.get("limit"));
    const where = buildWhere({
      companyId: company.id,
      category,
      channel,
      status,
      search
    });

    const replies = await prisma.savedReply.findMany({
      where,
      take: limit,
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }]
    });

    return NextResponse.json({ success: true, data: { replies } });
  } catch (error) {
    if (error instanceof ApiError) return handleApiError(error);
    console.error("Saved replies GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to load saved replies." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { context } = await requirePermission("savedReplies.manage");
    const { company } = context;
    const validation = validateSavedReplyInput(await request.json().catch(() => ({})));

    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    const reply = await prisma.savedReply.create({
      data: {
        companyId: company.id,
        title: validation.data.title ?? "",
        category: validation.data.category ?? "GENERAL",
        body: validation.data.body ?? "",
        shortcut: validation.data.shortcut ?? "",
        channel: validation.data.channel ?? "ALL",
        status: validation.data.status ?? "ACTIVE"
      }
    });

    return NextResponse.json({ success: true, data: { reply } }, { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) return handleApiError(error);
    console.error("Saved replies POST error:", error);
    return NextResponse.json({ success: false, error: "Failed to create saved reply." }, { status: 500 });
  }
}

function buildWhere({
  companyId,
  category,
  channel,
  status,
  search
}: {
  companyId: string;
  category?: string;
  channel?: string;
  status?: string;
  search?: string;
}): Prisma.SavedReplyWhereInput {
  const normalizedChannel = channel ? normalizeSavedReplyChannel(channel) : "ALL";

  return {
    companyId,
    ...(category && category.toUpperCase() !== "ALL" ? { category: normalizeSavedReplyCategory(category) } : {}),
    ...(status && status.toUpperCase() !== "ALL" ? { status: normalizeSavedReplyStatus(status) } : {}),
    ...(channel && channel.toUpperCase() !== "ALL"
      ? { channel: { in: ["ALL", normalizedChannel] } }
      : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { body: { contains: search, mode: "insensitive" } },
            { shortcut: { contains: search, mode: "insensitive" } },
            { category: { contains: search, mode: "insensitive" } }
          ]
        }
      : {})
  };
}

function parseLimit(value: string | null) {
  const parsed = Number(value ?? 100);
  if (!Number.isFinite(parsed)) return 100;
  return Math.min(Math.max(Math.floor(parsed), 1), 500);
}
