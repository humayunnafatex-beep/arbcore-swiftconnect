import { created, getPagination, handleApiError, ok, parseDate, parseJson } from "@/lib/api";
import { getCurrentAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { crmDealCreateSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stages = ["NEW_LEAD", "INTERESTED", "FOLLOW_UP", "WON", "LOST"] as const;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, pageSize, skip, take } = getPagination(searchParams);
    const owner = searchParams.get("owner") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const { company } = await getCurrentAuthContext();
    const where = {
      companyId: company.id,
      ...(owner ? { owner } : {}),
      ...(status ? { status: status as "OPEN" | "WON" | "LOST" } : {})
    };

    const [deals, total, grouped] = await Promise.all([
      prisma.crmDeal.findMany({
        where,
        skip,
        take,
        orderBy: { updatedAt: "desc" },
        include: { contact: true }
      }),
      prisma.crmDeal.count({ where }),
      prisma.crmDeal.groupBy({
        by: ["stage"],
        where,
        _count: { _all: true },
        _sum: { value: true }
      })
    ]);

    const pipeline = stages.map((stage) => {
      const match = grouped.find((item) => item.stage === stage);
      return {
        stage,
        count: match?._count._all ?? 0,
        value: match?._sum.value ?? 0
      };
    });

    return ok({ pipeline, deals, pagination: { page, pageSize, total } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, crmDealCreateSchema);
    const { company } = await getCurrentAuthContext();
    const deal = await prisma.crmDeal.create({
      data: {
        companyId: company.id,
        title: input.title,
        contactId: input.contactId,
        value: input.value ?? 0,
        stage: input.stage ?? "NEW_LEAD",
        status: input.status ?? "OPEN",
        owner: input.owner ?? undefined,
        nextAction: input.nextAction ?? undefined,
        dueAt: parseDate(input.dueAt)
      },
      include: { contact: true }
    });

    return created(deal);
  } catch (error) {
    return handleApiError(error);
  }
}
