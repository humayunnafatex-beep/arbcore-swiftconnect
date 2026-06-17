import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, handleApiError } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const updateSchema = z.object({
  category: z.string().trim().min(1).max(80).optional(),
  title: z.string().trim().min(1).max(120).optional(),
  content: z.string().trim().min(1).max(2000).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(999).optional()
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { context } = await requirePermission("settings.manage");
    const validation = updateSchema.safeParse(await request.json().catch(() => null));

    if (!validation.success) {
      return NextResponse.json({ success: false, error: "Knowledge base update is invalid." }, { status: 400 });
    }

    const existing = await prisma.businessKnowledgeFact.findFirst({
      where: { id: params.id, companyId: context.company.id }
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Knowledge base fact was not found." }, { status: 404 });
    }

    const fact = await prisma.businessKnowledgeFact.update({
      where: { id: existing.id },
      data: validation.data
    });

    return NextResponse.json({ success: true, data: { fact } });
  } catch (error) {
    if (error instanceof ApiError) return handleApiError(error);
    console.error("Knowledge base PATCH error:", error);
    return NextResponse.json({ success: false, error: "Unable to update knowledge base fact." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const { context } = await requirePermission("settings.manage");
    const existing = await prisma.businessKnowledgeFact.findFirst({
      where: { id: params.id, companyId: context.company.id }
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Knowledge base fact was not found." }, { status: 404 });
    }

    const fact = await prisma.businessKnowledgeFact.delete({
      where: { id: existing.id }
    });

    return NextResponse.json({ success: true, data: { fact } });
  } catch (error) {
    if (error instanceof ApiError) return handleApiError(error);
    console.error("Knowledge base DELETE error:", error);
    return NextResponse.json({ success: false, error: "Unable to delete knowledge base fact." }, { status: 500 });
  }
}
