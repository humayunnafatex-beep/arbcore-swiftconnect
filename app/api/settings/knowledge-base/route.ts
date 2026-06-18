import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, handleApiError } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";
import { sanitizeLogMetadata } from "@/lib/safe-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const factSchema = z.object({
  category: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(120),
  content: z.string().trim().min(1).max(2000),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(999).optional()
});

export async function GET() {
  try {
    const { context } = await requirePermission("settings.view");
    const facts = await prisma.businessKnowledgeFact.findMany({
      where: { companyId: context.company.id },
      orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }, { updatedAt: "desc" }]
    });

    return NextResponse.json({ success: true, data: { facts } });
  } catch (error) {
    if (error instanceof ApiError) return handleApiError(error);
    console.error("Knowledge base GET error:", sanitizeLogMetadata(error));
    return NextResponse.json({ success: false, error: "Unable to load knowledge base." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { context } = await requirePermission("settings.manage");
    const validation = factSchema.safeParse(await request.json().catch(() => null));

    if (!validation.success) {
      return NextResponse.json({ success: false, error: "Knowledge base fact is invalid." }, { status: 400 });
    }

    const fact = await prisma.businessKnowledgeFact.create({
      data: {
        companyId: context.company.id,
        category: validation.data.category,
        title: validation.data.title,
        content: validation.data.content,
        isActive: validation.data.isActive ?? true,
        sortOrder: validation.data.sortOrder ?? 0
      }
    });

    return NextResponse.json({ success: true, data: { fact } }, { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) return handleApiError(error);
    console.error("Knowledge base POST error:", sanitizeLogMetadata(error));
    return NextResponse.json({ success: false, error: "Unable to save knowledge base fact." }, { status: 500 });
  }
}
