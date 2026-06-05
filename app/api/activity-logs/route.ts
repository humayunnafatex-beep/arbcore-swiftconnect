import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ApiError, handleApiError } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { context } = await requirePermission("activity.view");
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType")?.trim();
    const action = searchParams.get("action")?.trim();
    const search = searchParams.get("search")?.trim();
    const limit = parseLimit(searchParams.get("limit"));
    const where: Prisma.ActivityLogWhereInput = {
      companyId: context.company.id,
      ...(entityType && entityType.toUpperCase() !== "ALL" ? { entityType } : {}),
      ...(action && action.toUpperCase() !== "ALL" ? { action } : {}),
      ...(search
        ? {
            OR: [
              { actorName: { contains: search, mode: Prisma.QueryMode.insensitive } },
              { actorEmail: { contains: search, mode: Prisma.QueryMode.insensitive } },
              { actorRole: { contains: search, mode: Prisma.QueryMode.insensitive } },
              { action: { contains: search, mode: Prisma.QueryMode.insensitive } },
              { entityType: { contains: search, mode: Prisma.QueryMode.insensitive } },
              { entityLabel: { contains: search, mode: Prisma.QueryMode.insensitive } },
              { summary: { contains: search, mode: Prisma.QueryMode.insensitive } },
              { metadataSummary: { contains: search, mode: Prisma.QueryMode.insensitive } }
            ]
          }
        : {})
    };

    const logs = await prisma.activityLog.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        actorName: true,
        actorEmail: true,
        actorRole: true,
        action: true,
        entityType: true,
        entityId: true,
        entityLabel: true,
        summary: true,
        metadataSummary: true,
        createdAt: true
      }
    });

    return NextResponse.json({ success: true, data: { logs } });
  } catch (error) {
    if (error instanceof ApiError) return handleApiError(error);
    console.error("Activity logs GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to load activity logs." }, { status: 500 });
  }
}

function parseLimit(value: string | null) {
  const parsed = Number(value ?? 100);
  if (!Number.isFinite(parsed)) return 100;
  return Math.min(Math.max(Math.floor(parsed), 1), 500);
}
