import { z } from "zod";
import { ApiError, handleApiError, ok, parseJson, parseDate } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedPlans = ["ENTERPRISE_BETA", "STARTER", "BUSINESS", "AGENCY", "ENTERPRISE"] as const;
const allowedStatuses = ["ACTIVE", "TRIAL", "PAST_DUE", "CANCELLED"] as const;
const allowedPlanSet = new Set<string>(allowedPlans);

const subscriptionUpdateSchema = z.object({
  plan: z.enum(allowedPlans),
  status: z.enum(allowedStatuses),
  currentPeriodStart: z.string().optional().nullable(),
  currentPeriodEnd: z.string().optional().nullable(),
  notes: z.string().optional().default("")
});

function serializeSubscription(subscription: {
  id: string | null;
  companyId: string;
  plan: string;
  status: string;
  billingMode: string;
  startedAt: Date | string | null;
  currentPeriodStart: Date | string | null;
  currentPeriodEnd: Date | string | null;
  notes: string;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}) {
  return {
    ...subscription,
    startedAt: subscription.startedAt ? new Date(subscription.startedAt).toISOString() : null,
    currentPeriodStart: subscription.currentPeriodStart ? new Date(subscription.currentPeriodStart).toISOString() : null,
    currentPeriodEnd: subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toISOString() : null,
    createdAt: subscription.createdAt ? new Date(subscription.createdAt).toISOString() : null,
    updatedAt: subscription.updatedAt ? new Date(subscription.updatedAt).toISOString() : null
  };
}

export async function GET() {
  try {
    const { context } = await requirePermission("billing.manage");
    const { company } = context;

    const subscription = await prisma.subscription.findFirst({
      where: { companyId: company.id },
      orderBy: { createdAt: "desc" }
    });

    if (!subscription) {
      const defaultPlan = allowedPlanSet.has(company.plan) ? company.plan : "ENTERPRISE_BETA";

      return ok({
        subscription: serializeSubscription({
          id: null,
          companyId: company.id,
          plan: defaultPlan,
          status: "ACTIVE",
          billingMode: "MANUAL",
          startedAt: null,
          currentPeriodStart: null,
          currentPeriodEnd: null,
          notes: "Default Enterprise Beta subscription. Save changes to create a manual subscription record."
        }),
        created: false
      });
    }

    return ok({ subscription: serializeSubscription(subscription), created: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, subscriptionUpdateSchema);
    const { context } = await requirePermission("billing.manage");
    const { company } = context;

    const currentPeriodStart = input.currentPeriodStart ? parseDate(input.currentPeriodStart) : null;
    const currentPeriodEnd = input.currentPeriodEnd ? parseDate(input.currentPeriodEnd) : null;

    if (currentPeriodStart && currentPeriodEnd && currentPeriodEnd < currentPeriodStart) {
      throw new ApiError(422, "INVALID_PERIOD", "Current period end must be after the start date.");
    }

    const existing = await prisma.subscription.findFirst({
      where: { companyId: company.id },
      orderBy: { createdAt: "desc" },
      select: { id: true }
    });

    const subscription = existing
      ? await prisma.subscription.update({
          where: { id: existing.id },
          data: {
            plan: input.plan,
            status: input.status,
            billingMode: "MANUAL",
            currentPeriodStart,
            currentPeriodEnd,
            notes: input.notes.trim()
          }
        })
      : await prisma.subscription.create({
          data: {
            companyId: company.id,
            plan: input.plan,
            status: input.status,
            billingMode: "MANUAL",
            currentPeriodStart,
            currentPeriodEnd,
            notes: input.notes.trim()
          }
        });

    return ok({ subscription: serializeSubscription(subscription) });
  } catch (error) {
    return handleApiError(error);
  }
}

export const PATCH = POST;
