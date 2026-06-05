import { ApiError, handleApiError, ok } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { validateProductInput } from "@/lib/product-input";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const { context } = await requirePermission("products.view");
    const product = await prisma.product.findFirst({
      where: { id: params.id, companyId: context.company.id }
    });

    if (!product) throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product was not found.");

    return ok({ product });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { context } = await requirePermission("products.manage");
    const existing = await prisma.product.findFirst({ where: { id: params.id, companyId: context.company.id } });

    if (!existing) throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product was not found.");

    const input = validateProductInput(await request.json().catch(() => null));
    const product = await prisma.product.update({
      where: { id: params.id },
      data: input
    });

    return ok({ product });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const { context } = await requirePermission("products.manage");
    const existing = await prisma.product.findFirst({ where: { id: params.id, companyId: context.company.id } });

    if (!existing) throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product was not found.");

    const product = await prisma.product.update({
      where: { id: params.id },
      data: { status: "ARCHIVED" }
    });

    return ok({ product, archived: true });
  } catch (error) {
    return handleApiError(error);
  }
}
