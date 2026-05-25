import { Prisma } from "@prisma/client";
import { created, getPagination, handleApiError, ok, parseJson } from "@/lib/api";
import { getCurrentAuthContext } from "@/lib/auth";
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
    const { company } = await getCurrentAuthContext();

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
    const { company } = await getCurrentAuthContext();
    const contact = await prisma.contact.create({
      data: {
        companyId: company.id,
        name: input.name,
        phone: input.phone,
        email: input.email ?? undefined,
        tags: normalizeTags(input.tags),
        segment: input.segment ?? undefined,
        stage: input.stage ?? "NEW_LEAD",
        optedIn: input.optedIn ?? true,
        metadata: input.metadata as Prisma.InputJsonValue | undefined
      }
    });

    return created(contact);
  } catch (error) {
    return handleApiError(error);
  }
}
