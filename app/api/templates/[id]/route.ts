import { ApiError, handleApiError, ok, parseJson } from "@/lib/api";
import { getCurrentAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { messageTemplateUpdateSchema, normalizeVariables } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = {
  params: { id: string };
};

export async function GET(_request: Request, { params }: Context) {
  try {
    const { company } = await getCurrentAuthContext();
    const template = await prisma.messageTemplate.findFirst({ where: { id: params.id, companyId: company.id } });

    if (!template) {
      throw new ApiError(404, "TEMPLATE_NOT_FOUND", "Message template was not found.");
    }

    return ok(template);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: Context) {
  try {
    const input = await parseJson(request, messageTemplateUpdateSchema);
    const { company } = await getCurrentAuthContext();
    const existing = await prisma.messageTemplate.findFirst({ where: { id: params.id, companyId: company.id } });

    if (!existing) {
      throw new ApiError(404, "TEMPLATE_NOT_FOUND", "Message template was not found.");
    }

    if (input.name && input.name !== existing.name) {
      const duplicate = await prisma.messageTemplate.findFirst({ where: { companyId: company.id, name: input.name } });
      if (duplicate) {
        throw new ApiError(409, "DUPLICATE_TEMPLATE", "A template with this name already exists in this workspace.");
      }
    }

    const template = await prisma.messageTemplate.update({
      where: { id: params.id },
      data: {
        ...("name" in input ? { name: input.name } : {}),
        ...("category" in input ? { category: input.category } : {}),
        ...("language" in input ? { language: input.language } : {}),
        ...("body" in input ? { body: input.body } : {}),
        ...("variables" in input ? { variables: normalizeVariables(input.variables) ?? null } : {}),
        ...("footerText" in input ? { footerText: input.footerText ?? null } : {}),
        ...("buttonText" in input ? { buttonText: input.buttonText ?? null } : {}),
        ...("buttonUrl" in input ? { buttonUrl: input.buttonUrl ?? null } : {}),
        ...("status" in input ? { status: input.status } : {})
      }
    });

    return ok(template);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    const { company } = await getCurrentAuthContext();
    const existing = await prisma.messageTemplate.findFirst({ where: { id: params.id, companyId: company.id } });

    if (!existing) {
      throw new ApiError(404, "TEMPLATE_NOT_FOUND", "Message template was not found.");
    }

    await prisma.messageTemplate.delete({ where: { id: params.id } });
    return ok({ id: params.id, deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
