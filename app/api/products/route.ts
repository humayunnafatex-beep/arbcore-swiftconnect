import { Prisma } from "@prisma/client";
import { created, handleApiError, ok } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { recordActivity, safeActivityLabel } from "@/lib/activity-log";
import { normalizeProductStatus, validateProductInput } from "@/lib/product-input";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { context } = await requirePermission("products.view");
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status")?.trim();
    const search = searchParams.get("search")?.trim();
    const limit = parseLimit(searchParams.get("limit"));
    const where: Prisma.ProductWhereInput = {
      companyId: context.company.id,
      ...(status && status !== "ALL" ? { status: normalizeProductStatus(status) } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
              { sku: { contains: search, mode: Prisma.QueryMode.insensitive } },
              { availableSizes: { contains: search, mode: Prisma.QueryMode.insensitive } },
              { stockNote: { contains: search, mode: Prisma.QueryMode.insensitive } }
            ]
          }
        : {})
    };

    const products = await prisma.product.findMany({
      where,
      take: limit,
      orderBy: { updatedAt: "desc" }
    });

    return ok({ products });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { context } = await requirePermission("products.manage");
    const input = validateProductInput(await request.json().catch(() => null));
    const product = await prisma.product.create({
      data: {
        companyId: context.company.id,
        ...input
      }
    });

    await recordActivity({
      companyId: context.company.id,
      action: "PRODUCT_CREATED",
      entityType: "PRODUCT",
      entityId: product.id,
      entityLabel: safeActivityLabel(product.name, product.sku),
      summary: "Created product record.",
      metadataSummary: `Status: ${product.status}`
    });

    return created({ product });
  } catch (error) {
    return handleApiError(error);
  }
}

function parseLimit(value: string | null) {
  const parsed = Number(value ?? 100);
  if (!Number.isFinite(parsed)) return 100;
  return Math.min(Math.max(Math.floor(parsed), 1), 500);
}
