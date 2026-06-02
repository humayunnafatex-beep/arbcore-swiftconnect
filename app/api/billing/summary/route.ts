import { handleApiError, ok } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedPlans = new Set(["ENTERPRISE_BETA", "STARTER", "BUSINESS", "AGENCY", "ENTERPRISE"]);

function iso(value?: Date | null) {
  return value ? value.toISOString() : null;
}

function daysUntil(value?: Date | null) {
  if (!value) return null;
  const end = new Date(value);
  end.setHours(23, 59, 59, 999);
  return Math.ceil((end.getTime() - Date.now()) / 86_400_000);
}

export async function GET() {
  try {
    const { context } = await requirePermission("billing.manage");
    const { company } = context;

    const [subscription, groupedPayments, lastPayment] = await Promise.all([
      prisma.subscription.findFirst({
        where: { companyId: company.id },
        orderBy: { createdAt: "desc" }
      }),
      prisma.paymentRecord.groupBy({
        by: ["status", "currency"],
        where: { companyId: company.id },
        _sum: { amount: true },
        _count: { _all: true }
      }),
      prisma.paymentRecord.findFirst({
        where: { companyId: company.id },
        orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }]
      })
    ]);

    const defaultPlan = allowedPlans.has(company.plan) ? company.plan : "ENTERPRISE_BETA";
    const currentSubscription = subscription ?? {
      plan: defaultPlan,
      status: "ACTIVE",
      billingMode: "MANUAL",
      currentPeriodStart: null,
      currentPeriodEnd: null
    };
    const preferredCurrency = lastPayment?.currency || "BDT";
    const totals = groupedPayments.reduce(
      (acc, item) => {
        if (item.status === "CONFIRMED") {
          acc.totalConfirmedAmount += item._sum.amount ?? 0;
          acc.confirmedCount += item._count._all;
        }
        if (item.status === "PENDING") {
          acc.totalPendingAmount += item._sum.amount ?? 0;
          acc.pendingCount += item._count._all;
        }
        if (item.status === "FAILED") acc.failedCount += item._count._all;
        if (item.status === "REFUNDED") acc.refundedCount += item._count._all;
        return acc;
      },
      {
        totalConfirmedAmount: 0,
        totalPendingAmount: 0,
        confirmedCount: 0,
        pendingCount: 0,
        failedCount: 0,
        refundedCount: 0
      }
    );
    const daysRemaining = daysUntil(currentSubscription.currentPeriodEnd);

    return ok({
      subscription: {
        plan: currentSubscription.plan,
        status: currentSubscription.status,
        billingMode: currentSubscription.billingMode,
        currentPeriodStart: iso(currentSubscription.currentPeriodStart),
        currentPeriodEnd: iso(currentSubscription.currentPeriodEnd)
      },
      payments: {
        ...totals,
        lastPaymentDate: iso(lastPayment?.paidAt ?? lastPayment?.createdAt ?? null),
        lastPaymentAmount: lastPayment?.amount ?? null,
        currency: preferredCurrency
      },
      health: {
        hasActiveSubscription: currentSubscription.status === "ACTIVE" || currentSubscription.status === "TRIAL",
        hasPendingPayment: totals.pendingCount > 0,
        isPastDue: currentSubscription.status === "PAST_DUE" || (typeof daysRemaining === "number" && daysRemaining < 0),
        daysUntilPeriodEnd: daysRemaining
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
