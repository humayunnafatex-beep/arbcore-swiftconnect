import { CampaignStatus, Prisma } from "@prisma/client";
import { created, getPagination, handleApiError, ok, parseDate, parseJson } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";
import { campaignCreateSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, pageSize, skip, take } = getPagination(searchParams);
    const status = searchParams.get("status")?.trim();
    const channel = searchParams.get("channel")?.trim();
    const search = searchParams.get("search")?.trim();
    const { context } = await requirePermission("campaign.view");
    const { company } = context;

    const where = {
      companyId: company.id,
      ...(status && status !== "ALL" ? { status: status as CampaignStatus } : {}),
      ...(channel && channel !== "ALL" ? { channel } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { audienceNote: { contains: search } },
              { messageBody: { contains: search } },
              { templateName: { contains: search } }
            ]
          }
        : {})
    } satisfies Prisma.CampaignWhereInput;

    const [items, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        skip,
        take,
        orderBy: { updatedAt: "desc" }
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
    const { context } = await requirePermission("campaign.manage");
    const { company } = context;
    const campaign = await prisma.campaign.create({
      data: {
        companyId: company.id,
        name: input.name,
        channel: input.channel ?? "WHATSAPP",
        status: (input.status ?? "DRAFT") as CampaignStatus,
        audienceNote: input.audienceNote ?? "",
        messageBody: input.messageBody,
        templateName: input.templateName ?? "",
        templateVariables: input.templateVariables as Prisma.InputJsonValue | undefined,
        targetSegment: input.targetSegment ?? undefined,
        whatsappAccountId: input.whatsappAccountId ?? undefined,
        scheduledAt: parseDate(input.scheduledAt),
        notes: input.notes ?? ""
      }
    });

    return created(campaign);
  } catch (error) {
    return handleApiError(error);
  }
}
