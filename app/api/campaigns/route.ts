import { Prisma } from "@prisma/client";
import { created, getPagination, handleApiError, ok, parseDate, parseJson } from "@/lib/api";
import { getCurrentAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { campaignCreateSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, pageSize, skip, take } = getPagination(searchParams);
    const status = searchParams.get("status")?.trim();
    const { company } = await getCurrentAuthContext();

    const where = {
      companyId: company.id,
      ...(status ? { status: status as "DRAFT" | "SCHEDULED" | "RUNNING" | "SENT" | "PAUSED" | "FAILED" } : {})
    };
    const [items, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: { whatsappAccount: true, _count: { select: { messageLogs: true } } }
      }),
      prisma.campaign.count({ where })
    ]);

    return ok({ items, pagination: { page, pageSize, total } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, campaignCreateSchema);
    const { company } = await getCurrentAuthContext();
    const campaign = await prisma.campaign.create({
      data: {
        companyId: company.id,
        name: input.name,
        templateName: input.templateName,
        templateVariables: input.templateVariables as Prisma.InputJsonValue | undefined,
        targetSegment: input.targetSegment ?? undefined,
        whatsappAccountId: input.whatsappAccountId ?? undefined,
        scheduledAt: parseDate(input.scheduledAt),
        status: input.scheduledAt ? "SCHEDULED" : "DRAFT"
      }
    });

    return created(campaign);
  } catch (error) {
    return handleApiError(error);
  }
}
