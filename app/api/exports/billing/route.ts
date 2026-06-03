import { createCsvResponse, datedExportFilename, rowsToCsv } from "@/lib/csv-export";
import { handleApiError } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = ["paymentId", "amount", "currency", "method", "status", "transactionRef", "paidAt", "createdAt", "notes"];

export async function GET() {
  try {
    const { context } = await requirePermission("license.view");
    const payments = await prisma.paymentRecord.findMany({
      where: { companyId: context.company.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        amount: true,
        currency: true,
        method: true,
        status: true,
        transactionRef: true,
        paidAt: true,
        createdAt: true,
        notes: true
      }
    });

    const rows = payments.map((payment) => ({
      paymentId: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      status: payment.status,
      transactionRef: payment.transactionRef,
      paidAt: payment.paidAt ?? "",
      createdAt: payment.createdAt,
      notes: payment.notes
    }));

    return createCsvResponse(rowsToCsv(headers, rows), datedExportFilename("arbcore-billing-records"));
  } catch (error) {
    return handleApiError(error);
  }
}
