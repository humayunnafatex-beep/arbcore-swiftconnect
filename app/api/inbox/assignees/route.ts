import { NextResponse } from "next/server";
import { ApiError, handleApiError } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { context } = await requirePermission("messages.viewLogs");
    const { company } = context;

    const users = await prisma.user.findMany({
      where: {
        companyId: company.id,
        isActive: true
      },
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    return NextResponse.json({
      success: true,
      data: { users }
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return handleApiError(error);
    }

    console.error("Inbox assignees GET error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to load inbox assignees." },
      { status: 500 }
    );
  }
}
