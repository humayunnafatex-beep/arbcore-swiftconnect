import { Prisma } from "@prisma/client";
import { ApiError, created, getPagination, handleApiError, ok, parseJson } from "@/lib/api";
import { getCurrentAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { messageTemplateCreateSchema, normalizeVariables } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, pageSize, skip, take } = getPagination(searchParams);
    const q = searchParams.get("q")?.trim();
    const status = searchParams.get("status")?.trim();
    const category = searchParams.get("category")?.trim();
    const { company } = await getCurrentAuthContext();

    const where: Prisma.MessageTemplateWhereInput = {
      companyId: company.id,
      ...(status ? { status: status as Prisma.EnumMessageTemplateStatusFilter["equals"] } : {}),
      ...(category ? { category: category as Prisma.EnumMessageTemplateCategoryFilter["equals"] } : {}),
      ...(q ? { OR: [{ name: { contains: q } }, { body: { contains: q } }] } : {})
    };

    const [items, total] = await Promise.all([
      prisma.messageTemplate.findMany({ where, skip, take, orderBy: { updatedAt: "desc" } }),
      prisma.messageTemplate.count({ where })
    ]);

    return ok({ items, pagination: { page, pageSize, total } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, messageTemplateCreateSchema);
    const { company } = await getCurrentAuthContext();
    const duplicate = await prisma.messageTemplate.findFirst({
      where: { companyId: company.id, name: input.name }
    });

    if (duplicate) {
      throw new ApiError(409, "DUPLICATE_TEMPLATE", "A template with this name already exists in this workspace.");
    }

    const template = await prisma.messageTemplate.create({
      data: {
        companyId: company.id,
        name: input.name,
        category: input.category ?? "MARKETING",
        language: input.language ?? "ENGLISH",
        body: input.body,
        variables: normalizeVariables(input.variables),
        footerText: input.footerText ?? undefined,
        buttonText: input.buttonText ?? undefined,
        buttonUrl: input.buttonUrl ?? undefined,
        status: input.status ?? "DRAFT"
      }
    });

    return created(template);
  } catch (error) {
    return handleApiError(error);
  }
}
