import { ApiError, created, handleApiError, ok, parseJson } from "@/lib/api";
import { getCurrentAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { conversationMessageCreateSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = {
  params: { id: string };
};

export async function GET(_request: Request, { params }: Context) {
  try {
    const { company } = await getCurrentAuthContext();
    const conversation = await prisma.conversation.findFirst({
      where: { id: params.id, companyId: company.id },
      include: {
        contact: true,
        whatsappAccount: true,
        messages: { orderBy: { createdAt: "asc" } }
      }
    });

    if (!conversation) {
      throw new ApiError(404, "CONVERSATION_NOT_FOUND", "Conversation was not found.");
    }

    return ok(conversation);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, { params }: Context) {
  try {
    const input = await parseJson(request, conversationMessageCreateSchema);
    const { company } = await getCurrentAuthContext();
    const now = new Date();
    const message = await prisma.$transaction(async (tx) => {
      const conversation = await tx.conversation.findFirst({ where: { id: params.id, companyId: company.id } });

      if (!conversation) {
        throw new ApiError(404, "CONVERSATION_NOT_FOUND", "Conversation was not found.");
      }

      const createdMessage = await tx.conversationMessage.create({
        data: {
          conversationId: params.id,
          body: input.body,
          direction: input.direction,
          status: input.status ?? (input.direction === "INBOUND" ? "RECEIVED" : "SENT"),
          createdAt: now
        }
      });

      await tx.conversation.update({
        where: { id: params.id },
        data: { lastMessageAt: now }
      });

      return createdMessage;
    });

    return created(message);
  } catch (error) {
    return handleApiError(error);
  }
}
