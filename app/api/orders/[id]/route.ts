import { Prisma } from "@prisma/client";
import { ApiError, handleApiError, ok } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { formatChangeSummary, recordActivity, safeActivityLabel } from "@/lib/activity-log";
import { orderInputSchema } from "@/lib/order-input";
import { calculateOrderTotal, normalizeOrderStatus, normalizePaymentStatus } from "@/lib/order-status";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = {
  params: { id: string };
};

export async function GET(_request: Request, { params }: Context) {
  try {
    const { context } = await requirePermission("orders.view");
    const order = await prisma.order.findFirst({
      where: { id: params.id, companyId: context.company.id },
      include: { contact: { select: { id: true, name: true, phone: true, email: true, stage: true, tags: true } } }
    });

    if (!order) throw new ApiError(404, "ORDER_NOT_FOUND", "Order was not found.");

    return ok({ order });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    const { context } = await requirePermission("orders.manage");
    const existing = await prisma.order.findFirst({ where: { id: params.id, companyId: context.company.id } });

    if (!existing) throw new ApiError(404, "ORDER_NOT_FOUND", "Order was not found.");

    const input = orderInputSchema.partial().parse(await request.json().catch(() => null));
    const contact = input.contactId ? await prisma.contact.findFirstOrThrow({ where: { id: input.contactId, companyId: context.company.id } }) : null;
    const quantity = input.quantity ?? existing.quantity;
    const unitPrice = input.unitPrice ?? existing.unitPrice;
    const deliveryCharge = input.deliveryCharge ?? existing.deliveryCharge;
    const followUpAt = parseOptionalDate(input.followUpAt);
    const data: Prisma.OrderUpdateInput = {
      ...(input.contactId !== undefined ? { contact: contact ? { connect: { id: contact.id } } : { disconnect: true } } : {}),
      ...(input.channel !== undefined ? { channel: input.channel } : {}),
      ...(input.customerKey !== undefined ? { customerKey: input.customerKey } : {}),
      ...(input.orderNumber !== undefined ? { orderNumber: input.orderNumber || existing.orderNumber } : {}),
      ...(input.modelName !== undefined ? { modelName: input.modelName } : {}),
      ...(input.size !== undefined ? { size: input.size } : {}),
      quantity,
      unitPrice,
      deliveryCharge,
      totalAmount: calculateOrderTotal({ quantity, unitPrice, deliveryCharge }),
      ...(input.customerName !== undefined ? { customerName: input.customerName } : {}),
      ...(input.customerPhone !== undefined ? { customerPhone: input.customerPhone } : {}),
      ...(input.deliveryAddress !== undefined ? { deliveryAddress: input.deliveryAddress } : {}),
      ...(input.paymentStatus !== undefined ? { paymentStatus: normalizePaymentStatus(input.paymentStatus) } : {}),
      ...(input.orderStatus !== undefined ? { orderStatus: normalizeOrderStatus(input.orderStatus) } : {}),
      ...(input.followUpAt !== undefined ? { followUpAt } : {}),
      ...(input.followUpDone !== undefined ? { followUpDone: input.followUpDone } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {})
    };

    const order = await prisma.order.update({
      where: { id: params.id },
      data,
      include: { contact: { select: { id: true, name: true, phone: true, email: true, stage: true, tags: true } } }
    });

    await recordActivity({
      companyId: context.company.id,
      action: "ORDER_UPDATED",
      entityType: "ORDER",
      entityId: order.id,
      entityLabel: safeActivityLabel(order.orderNumber, order.customerName || order.customerPhone),
      summary: formatChangeSummary(existing, order, ["orderStatus", "paymentStatus", "quantity", "unitPrice", "deliveryCharge", "totalAmount", "followUpAt", "followUpDone"]),
      metadataSummary: `Status: ${order.orderStatus}; Payment: ${order.paymentStatus}`
    });

    return ok({ order });
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

export async function DELETE(_request: Request, { params }: Context) {
  try {
    const { context } = await requirePermission("orders.manage");
    const existing = await prisma.order.findFirst({ where: { id: params.id, companyId: context.company.id } });

    if (!existing) throw new ApiError(404, "ORDER_NOT_FOUND", "Order was not found.");

    const order = await prisma.order.update({
      where: { id: params.id },
      data: { orderStatus: "CANCELLED" },
      include: { contact: { select: { id: true, name: true, phone: true, email: true, stage: true, tags: true } } }
    });

    await recordActivity({
      companyId: context.company.id,
      action: "ORDER_CANCELLED",
      entityType: "ORDER",
      entityId: order.id,
      entityLabel: safeActivityLabel(order.orderNumber, order.customerName || order.customerPhone),
      summary: "Cancelled order record.",
      metadataSummary: `Status: ${order.orderStatus}`
    });

    return ok({ order, cancelled: true });
  } catch (error) {
    return handleApiError(error);
  }
}
