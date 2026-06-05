import { createCsvResponse, datedExportFilename, rowsToCsv } from "@/lib/csv-export";
import { handleApiError } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = [
  "orderNumber",
  "customerName",
  "customerPhone",
  "modelName",
  "size",
  "quantity",
  "unitPrice",
  "deliveryCharge",
  "totalAmount",
  "paymentStatus",
  "orderStatus",
  "deliveryAddress",
  "notes",
  "createdAt",
  "updatedAt"
];

export async function GET() {
  try {
    const { context } = await requirePermission("orders.view");
    const orders = await prisma.order.findMany({
      where: { companyId: context.company.id },
      orderBy: { createdAt: "desc" }
    });

    const rows = orders.map((order) => ({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      modelName: order.modelName,
      size: order.size,
      quantity: order.quantity,
      unitPrice: order.unitPrice,
      deliveryCharge: order.deliveryCharge,
      totalAmount: order.totalAmount,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      deliveryAddress: order.deliveryAddress,
      notes: order.notes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }));

    return createCsvResponse(rowsToCsv(headers, rows), datedExportFilename("arbcore-orders"));
  } catch (error) {
    return handleApiError(error);
  }
}
