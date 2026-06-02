import { Prisma } from "@prisma/client";
import { created, getPagination, handleApiError, ok, parseJson } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";
import { contactCreateSchema, normalizeTags } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, pageSize, skip, take } = getPagination(searchParams);
    const q = searchParams.get("q")?.trim();
    const segment = searchParams.get("segment")?.trim();
    const stage = searchParams.get("stage")?.trim();
    const { context } = await requirePermission("contacts.view");
    const { company } = context;

    const where = {
      companyId: company.id,
      ...(segment ? { segment } : {}),
      ...(stage ? { stage: stage as "NEW_LEAD" | "INTERESTED" | "FOLLOW_UP" | "WON" | "LOST" } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { phone: { contains: q } },
              { email: { contains: q } }
            ]
          }
        : {})
    };

    const [items, total] = await Promise.all([
      prisma.contact.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
      prisma.contact.count({ where })
    ]);

    return ok({ items, pagination: { page, pageSize, total } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, contactCreateSchema);
    const { context } = await requirePermission("contacts.manage");
    const { company } = context;
    const phone = input.phone.trim();
    const existingContact = await prisma.contact.findFirst({
      where: { companyId: company.id, phone },
      select: { id: true, name: true }
    });

    if (existingContact) {
      return Response.json(
        {
          success: false,
          error: {
            code: "DUPLICATE_CONTACT_PHONE",
            message: `A contact with this phone number already exists in this workspace: ${existingContact.name}.`
          }
        },
        { status: 409 }
      );
    }

    const contact = await prisma.contact.create({
      data: {
        companyId: company.id,
        name: input.name.trim(),
        phone,
        email: input.email?.trim() || undefined,
        tags: normalizeTags(input.tags),
        segment: input.segment?.trim() || undefined,
        stage: input.stage ?? "NEW_LEAD",
        optedIn: input.optedIn ?? true,
        metadata: input.metadata as Prisma.InputJsonValue | undefined
      }
    });

    return created(contact);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return Response.json(
        {
          success: false,
          error: {
            code: "DUPLICATE_CONTACT_PHONE",
            message: "A contact with this phone number already exists. Current beta schema keeps contact phone numbers globally unique."
          }
        },
        { status: 409 }
      );
    }

    return handleApiError(error);
  }
}
