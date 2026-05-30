import { Prisma } from "@prisma/client";
import { ApiError, handleApiError, ok, parseJson } from "@/lib/api";
import { getCurrentAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { contactUpdateSchema, normalizeTags } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = {
  params: { id: string };
};

export async function GET(_request: Request, { params }: Context) {
  try {
    const { company } = await getCurrentAuthContext();
    const contact = await prisma.contact.findFirst({
      where: { id: params.id, companyId: company.id },
      include: { crmDeals: true, conversations: { orderBy: { updatedAt: "desc" }, take: 10 } }
    });

    if (!contact) {
      throw new ApiError(404, "CONTACT_NOT_FOUND", "Contact was not found.");
    }

    return ok(contact);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: Context) {
  try {
    const input = await parseJson(request, contactUpdateSchema);
    const { company } = await getCurrentAuthContext();
    const existing = await prisma.contact.findFirst({ where: { id: params.id, companyId: company.id } });

    if (!existing) {
      throw new ApiError(404, "CONTACT_NOT_FOUND", "Contact was not found.");
    }

    const contact = await prisma.contact.update({
      where: { id: params.id },
      data: {
        ...("name" in input ? { name: input.name } : {}),
        ...("phone" in input ? { phone: input.phone } : {}),
        ...("email" in input ? { email: input.email ?? null } : {}),
        ...("tags" in input ? { tags: normalizeTags(input.tags) ?? null } : {}),
        ...("segment" in input ? { segment: input.segment ?? null } : {}),
        ...("stage" in input ? { stage: input.stage } : {}),
        ...("optedIn" in input ? { optedIn: input.optedIn } : {}),
        ...("metadata" in input ? { metadata: input.metadata as Prisma.InputJsonValue | undefined } : {})
      }
    });

    return ok(contact);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return Response.json(
        {
          success: false,
          error: {
            code: "DUPLICATE_CONTACT_PHONE",
            message: "A contact with this phone number already exists."
          }
        },
        { status: 409 }
      );
    }

    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    const { company } = await getCurrentAuthContext();
    const existing = await prisma.contact.findFirst({ where: { id: params.id, companyId: company.id } });

    if (!existing) {
      throw new ApiError(404, "CONTACT_NOT_FOUND", "Contact was not found.");
    }

    await prisma.contact.delete({ where: { id: params.id } });
    return ok({ id: params.id, deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
