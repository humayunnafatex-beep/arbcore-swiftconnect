import { z } from "zod";
import { ApiError, created, handleApiError, ok, parseJson, parseDate } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedStatuses = ["PENDING", "CONFIRMED", "FAILED", "REFUNDED"] as const;
const allowedMethods = ["MANUAL", "CASH", "BANK", "BKASH", "NAGAD", "SSLCOMMERZ_FUTURE", "STRIPE_FUTURE"] as const;

const paymentCreateSchema = z.object({
  amount: z.coerce.number().int().positive(),
  currency: z.string().trim().min(1).max(8).default("BDT"),
  method: z.enum(allowedMethods),
  status: z.enum(allowedStatuses),
  transactionRef: z.string().optional().default(""),
  paidAt: z.string().optional().nullable(),
  notes: z.string().optional().default("")
});

function serializePayment(payment: {
  id: string;
  companyId: string;
  subscriptionId: string | null;
  amount: number;
  currency: string;
  method: string;
  status: string;
  transactionRef: string;
  paidAt: Date | string | null;
  notes: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}) {
  return {
    ...payment,
    paidAt: payment.paidAt ? new Date(payment.paidAt).toISOString() : null,
    createdAt: new Date(payment.createdAt).toISOString(),
    updatedAt: new Date(payment.updatedAt).toISOString()
  };
}

export async function GET() {
  try {
    const { context } = await requirePermission("billing.manage");
    const { company } = context;

    const payments = await prisma.paymentRecord.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: "desc" },
      take: 50
    });

    return ok({ payments: payments.map(serializePayment) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, paymentCreateSchema);
    const { context } = await requirePermission("billing.manage");
    const { company } = context;

    const paidAt = input.paidAt ? parseDate(input.paidAt) : null;
    const subscription = await prisma.subscription.findFirst({
      where: { companyId: company.id },
      orderBy: { createdAt: "desc" },
      select: { id: true }
    });

    if (input.status === "CONFIRMED" && !paidAt) {
      throw new ApiError(422, "PAID_DATE_REQUIRED", "Paid date is required when confirming a manual payment.");
    }

    const payment = await prisma.paymentRecord.create({
      data: {
        companyId: company.id,
        subscriptionId: subscription?.id,
        amount: input.amount,
        currency: input.currency.toUpperCase(),
        method: input.method,
        status: input.status,
        transactionRef: input.transactionRef.trim(),
        paidAt,
        notes: input.notes.trim()
      }
    });

    return created({ payment: serializePayment(payment) });
  } catch (error) {
    return handleApiError(error);
  }
}
