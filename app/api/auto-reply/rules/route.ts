import { created, getPagination, handleApiError, ok, parseJson } from "@/lib/api";
import { getCurrentAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { autoReplyRuleCreateSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, pageSize, skip, take } = getPagination(searchParams);
    const isActive = searchParams.get("isActive");
    const { company } = await getCurrentAuthContext();

    const where =
      isActive === null
        ? { companyId: company.id }
        : {
            companyId: company.id,
            isActive: isActive === "true"
          };

    const [items, total] = await Promise.all([
      prisma.autoReplyRule.findMany({ where, skip, take, orderBy: [{ priority: "asc" }, { createdAt: "desc" }] }),
      prisma.autoReplyRule.count({ where })
    ]);

    return ok({ items, pagination: { page, pageSize, total } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, autoReplyRuleCreateSchema);
    const { company } = await getCurrentAuthContext();
    const rule = await prisma.autoReplyRule.create({
      data: {
        companyId: company.id,
        keyword: input.keyword,
        response: input.response,
        priority: input.priority ?? 100,
        isActive: input.isActive ?? true,
        matchMode: input.matchMode ?? "CONTAINS"
      }
    });

    return created(rule);
  } catch (error) {
    return handleApiError(error);
  }
}
