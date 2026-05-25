import { created, getPagination, handleApiError, ok, parseJson } from "@/lib/api";
import { getCurrentAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { conversationCreateSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, pageSize, skip, take } = getPagination(searchParams);
    const status = searchParams.get("status") ?? "OPEN";
    const assignedTo = searchParams.get("assignedTo") ?? undefined;
    const { company } = await getCurrentAuthContext();

    const where = {
      companyId: company.id,
      ...(status ? { status } : {}),
      ...(assignedTo ? { assignedTo } : {})
    };

    const [items, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        skip,
        take,
        orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
        include: {
          contact: true,
          whatsappAccount: true,
          messages: { orderBy: { createdAt: "desc" }, take: 1 }
        }
      }),
      prisma.conversation.count({ where })
    ]);

    return ok({ items, pagination: { page, pageSize, total } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, conversationCreateSchema);
    const { company } = await getCurrentAuthContext();
    const now = new Date();
    const conversation = await prisma.conversation.create({
      data: {
        companyId: company.id,
        contactId: input.contactId,
        whatsappAccountId: input.whatsappAccountId ?? undefined,
        subject: input.subject ?? undefined,
        assignedTo: input.assignedTo ?? undefined,
        lastMessageAt: input.body ? now : undefined,
        messages: input.body
          ? {
              create: {
                body: input.body,
                direction: "INBOUND",
                status: "RECEIVED",
                createdAt: now
              }
            }
          : undefined
      },
      include: { contact: true, messages: true, whatsappAccount: true }
    });

    return created(conversation);
  } catch (error) {
    return handleApiError(error);
  }
}
