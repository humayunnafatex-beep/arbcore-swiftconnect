import { createCsvResponse, datedExportFilename, rowsToCsv } from "@/lib/csv-export";
import { handleApiError } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = [
  "name",
  "sku",
  "price",
  "availableSizes",
  "stockNote",
  "imageUrl",
  "status",
  "notes",
  "createdAt",
  "updatedAt"
];

export async function GET() {
  try {
    const { context } = await requirePermission("products.view");
    const products = await prisma.product.findMany({
      where: { companyId: context.company.id },
      orderBy: { createdAt: "desc" }
    });

    const rows = products.map((product) => ({
      name: product.name,
      sku: product.sku,
      price: product.price,
      availableSizes: product.availableSizes,
      stockNote: product.stockNote,
      imageUrl: product.imageUrl,
      status: product.status,
      notes: product.notes,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    }));

    return createCsvResponse(rowsToCsv(headers, rows), datedExportFilename("arbcore-products"));
  } catch (error) {
    return handleApiError(error);
  }
}
