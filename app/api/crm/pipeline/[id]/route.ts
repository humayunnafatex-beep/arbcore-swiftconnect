import { ApiError, handleApiError, ok, parseDate, parseJson } from "@/lib/api";
import { getCurrentAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { crmDealUpdateSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = {
  params: { id: string };
};

export async function PUT(request: Request, { params }: Context) {
  try {
    const input = await parseJson(request, crmDealUpdateSchema);
    const { company } = await getCurrentAuthContext();
    const existing = await prisma.crmDeal.findFirst({ where: { id: params.id, companyId: company.id } });

    if (!existing) {
      throw new ApiError(404, "CRM_DEAL_NOT_FOUND", "CRM deal was not found.");
    }

    const deal = await prisma.crmDeal.update({
      where: { id: params.id },
      data: {
        ...("title" in input ? { title: input.title } : {}),
        ...("value" in input ? { value: input.value } : {}),
        ...("stage" in input ? { stage: input.stage } : {}),
        ...("status" in input ? { status: input.status } : {}),
        ...("owner" in input ? { owner: input.owner ?? null } : {}),
        ...("nextAction" in input ? { nextAction: input.nextAction ?? null } : {}),
        ...("dueAt" in input ? { dueAt: parseDate(input.dueAt) } : {})
      },
      include: { contact: true }
    });

    return ok(deal);
  } catch (error) {
    return handleApiError(error);
  }
}
