import { created, getPagination, handleApiError, ok, parseJson } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";
import { autoReplyRuleCreateSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, pageSize, skip, take } = getPagination(searchParams);
    const isActive = searchParams.get("isActive");
    const { context } = await requirePermission("autoReply.view");
    const { company } = context;

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
    const { context } = await requirePermission("autoReply.manage");
    const { company } = context;
    const rule = await prisma.autoReplyRule.create({
      data: {
        companyId: company.id,
        keyword: input.keyword.trim(),
        response: input.response.trim(),
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
