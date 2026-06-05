import { Prisma } from "@prisma/client";
import { created, getPagination, handleApiError, ok, parseJson } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { normalizeContactStatus } from "@/lib/contact-status";
import { tagsMatchSearch } from "@/lib/contact-tags";
import { prisma } from "@/lib/prisma";
import { contactCreateSchema, normalizeTags } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, pageSize, skip, take } = getPagination(searchParams);
    const q = searchParams.get("search")?.trim() || searchParams.get("q")?.trim();
    const segment = searchParams.get("segment")?.trim();
    const stage = searchParams.get("status")?.trim() || searchParams.get("stage")?.trim();
    const tag = searchParams.get("tag")?.trim();
    const { context } = await requirePermission("contacts.view");
    const { company } = context;

    const where: Prisma.ContactWhereInput = {
      companyId: company.id,
      ...(segment ? { segment } : {}),
      ...(stage && stage.toUpperCase() !== "ALL" ? { stage: normalizeContactStatus(stage) } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: Prisma.QueryMode.insensitive } },
              { phone: { contains: q, mode: Prisma.QueryMode.insensitive } },
              { email: { contains: q, mode: Prisma.QueryMode.insensitive } },
              { tags: { contains: q, mode: Prisma.QueryMode.insensitive } },
              { whatsappProfileName: { contains: q, mode: Prisma.QueryMode.insensitive } },
              { lastReferralHeadline: { contains: q, mode: Prisma.QueryMode.insensitive } },
              { lastReferralBody: { contains: q, mode: Prisma.QueryMode.insensitive } },
              { lastReferralSourceId: { contains: q, mode: Prisma.QueryMode.insensitive } }
            ]
          }
        : {})
    };

    const [items, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: tag ? Math.max(take, 500) : take,
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { orders: true } } }
      }),
      prisma.contact.count({ where })
    ]);

    const filteredItems = tag ? items.filter((contact) => tagsMatchSearch(contact.tags, tag)).slice(0, take) : items;

    return ok({ items: filteredItems, pagination: { page, pageSize, total: tag ? filteredItems.length : total } });
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
        tags: normalizeTags(input.tags) ?? null,
        segment: input.segment?.trim() || undefined,
        profileSource: "MANUAL",
        stage: normalizeContactStatus(input.stage),
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
