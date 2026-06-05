import { ApiError, handleApiError, ok } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { generateOrderNumber, orderInputSchema } from "@/lib/order-input";
import { calculateOrderTotal, normalizeOrderStatus, normalizePaymentStatus } from "@/lib/order-status";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ConversationChannel = "WHATSAPP" | "MESSENGER";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const { context } = await requirePermission("orders.view");
    const conversation = decodeConversationId(params.id);
    const contact = conversation.channel === "WHATSAPP"
      ? await findMatchingContact(context.company.id, conversation.contactKey)
      : null;

    const orders = await prisma.order.findMany({
      where: {
        companyId: context.company.id,
        OR: [
          { channel: conversation.channel, customerKey: conversation.contactKey },
          ...(contact ? [{ contactId: contact.id }] : [])
        ]
      },
      take: 10,
      orderBy: { updatedAt: "desc" },
      include: { contact: { select: { id: true, name: true, phone: true, email: true, stage: true, tags: true } } }
    });

    return ok({ orders, contact });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { context } = await requirePermission("orders.manage");
    const conversation = decodeConversationId(params.id);
    const input = orderInputSchema.parse(await request.json().catch(() => null));
    const contact = input.contactId
      ? await prisma.contact.findFirstOrThrow({ where: { id: input.contactId, companyId: context.company.id } })
      : conversation.channel === "WHATSAPP"
        ? await findMatchingContact(context.company.id, conversation.contactKey)
        : null;
    const quantity = input.quantity ?? 1;
    const unitPrice = input.unitPrice ?? 0;
    const deliveryCharge = input.deliveryCharge ?? 0;

    const order = await prisma.order.create({
      data: {
        companyId: context.company.id,
        contactId: contact?.id,
        channel: conversation.channel,
        customerKey: conversation.contactKey,
        orderNumber: input.orderNumber || generateOrderNumber(),
        modelName: input.modelName ?? "",
        size: input.size ?? "",
        quantity,
        unitPrice,
        deliveryCharge,
        totalAmount: calculateOrderTotal({ quantity, unitPrice, deliveryCharge }),
        customerName: input.customerName || contact?.name || "",
        customerPhone: input.customerPhone || contact?.phone || conversation.contactKey,
        deliveryAddress: input.deliveryAddress ?? "",
        paymentStatus: normalizePaymentStatus(input.paymentStatus),
        orderStatus: normalizeOrderStatus(input.orderStatus),
        followUpAt: parseOptionalDate(input.followUpAt),
        followUpDone: input.followUpDone ?? false,
        notes: input.notes ?? ""
      },
      include: { contact: { select: { id: true, name: true, phone: true, email: true, stage: true, tags: true } } }
    });

    return ok({ order }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

function parseOptionalDate(value: string | null | undefined) {
  if (value === null) return null;
  if (value === undefined || !value.trim()) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new ApiError(400, "INVALID_FOLLOW_UP_AT", "Follow-up date is invalid.");
  }

  return parsed;
}

function decodeConversationId(id: string): { channel: ConversationChannel; contactKey: string } {
  try {
    const parsed = JSON.parse(Buffer.from(id, "base64url").toString("utf8")) as {
      channel?: string;
      contactKey?: string;
    };

    if ((parsed.channel !== "WHATSAPP" && parsed.channel !== "MESSENGER") || !parsed.contactKey) {
      throw new Error("Invalid conversation id");
    }

    return { channel: parsed.channel, contactKey: parsed.contactKey };
  } catch {
    throw new ApiError(400, "INVALID_CONVERSATION", "Invalid inbox conversation.");
  }
}

async function findMatchingContact(companyId: string, contactKey: string) {
  const candidates = phoneMatchCandidates(contactKey);
  const contacts = await prisma.contact.findMany({
    where: { companyId },
    select: { id: true, name: true, phone: true, email: true, stage: true, tags: true }
  });

  return contacts.find((contact) => Array.from(phoneMatchCandidates(contact.phone)).some((candidate) => candidates.has(candidate))) ?? null;
}

function phoneMatchCandidates(phone: string) {
  const normalized = phone.replace(/[^\d]/g, "");
  const candidates = new Set<string>();
  if (normalized) candidates.add(normalized);
  if (normalized.startsWith("8801") && normalized.length === 13) candidates.add(`0${normalized.slice(3)}`);
  if (normalized.startsWith("01") && normalized.length === 11) candidates.add(`880${normalized.slice(1)}`);
  return candidates;
}
