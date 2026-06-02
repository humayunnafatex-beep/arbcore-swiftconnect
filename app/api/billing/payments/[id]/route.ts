import { ApiError, handleApiError, ok } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function iso(value?: Date | null) {
  return value ? value.toISOString() : null;
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const { context } = await requirePermission("billing.manage");
    const { company } = context;

    const payment = await prisma.paymentRecord.findFirst({
      where: { id: params.id, companyId: company.id },
      include: {
        subscription: {
          select: {
            plan: true,
            status: true,
            billingMode: true,
            currentPeriodStart: true,
            currentPeriodEnd: true
          }
        },
        company: {
          select: {
            name: true,
            businessName: true,
            workspaceName: true
          }
        }
      }
    });

    if (!payment) {
      throw new ApiError(404, "PAYMENT_NOT_FOUND", "Payment record not found.");
    }

    return ok({
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        status: payment.status,
        transactionRef: payment.transactionRef,
        paidAt: iso(payment.paidAt),
        notes: payment.notes,
        createdAt: iso(payment.createdAt),
        updatedAt: iso(payment.updatedAt),
        subscription: payment.subscription
          ? {
              ...payment.subscription,
              currentPeriodStart: iso(payment.subscription.currentPeriodStart),
              currentPeriodEnd: iso(payment.subscription.currentPeriodEnd)
            }
          : null,
        company: {
          name: payment.company.businessName || payment.company.name,
          workspaceName: payment.company.workspaceName
        }
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
