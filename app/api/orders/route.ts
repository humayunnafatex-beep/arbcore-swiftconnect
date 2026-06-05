import { Prisma } from "@prisma/client";
import { created, handleApiError, ok } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { generateOrderNumber, orderInputSchema } from "@/lib/order-input";
import { calculateOrderTotal, normalizeOrderStatus, normalizePaymentStatus } from "@/lib/order-status";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { context } = await requirePermission("orders.view");
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status")?.trim();
    const paymentStatus = searchParams.get("paymentStatus")?.trim();
    const contactId = searchParams.get("contactId")?.trim();
    const search = searchParams.get("search")?.trim();
    const limit = parseLimit(searchParams.get("limit"));
    const where: Prisma.OrderWhereInput = {
      companyId: context.company.id,
      ...(status && status !== "ALL" ? { orderStatus: normalizeOrderStatus(status) } : {}),
      ...(paymentStatus && paymentStatus !== "ALL" ? { paymentStatus: normalizePaymentStatus(paymentStatus) } : {}),
      ...(contactId ? { contactId } : {}),
      ...(search
        ? {
            OR: [
              { orderNumber: { contains: search, mode: Prisma.QueryMode.insensitive } },
              { customerName: { contains: search, mode: Prisma.QueryMode.insensitive } },
              { customerPhone: { contains: search, mode: Prisma.QueryMode.insensitive } },
              { modelName: { contains: search, mode: Prisma.QueryMode.insensitive } },
              { size: { contains: search, mode: Prisma.QueryMode.insensitive } },
              { contact: { name: { contains: search, mode: Prisma.QueryMode.insensitive } } },
              { contact: { phone: { contains: search, mode: Prisma.QueryMode.insensitive } } }
            ]
          }
        : {})
    };

    const orders = await prisma.order.findMany({
      where,
      take: limit,
      orderBy: { updatedAt: "desc" },
      include: { contact: { select: { id: true, name: true, phone: true, email: true, stage: true, tags: true } } }
    });

    return ok({ orders });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { context } = await requirePermission("orders.manage");
    const input = orderInputSchema.parse(await request.json().catch(() => null));
    const contact = input.contactId ? await getContactForCompany(context.company.id, input.contactId) : null;
    const quantity = input.quantity ?? 1;
    const unitPrice = input.unitPrice ?? 0;
    const deliveryCharge = input.deliveryCharge ?? 0;

    const order = await prisma.order.create({
      data: {
        companyId: context.company.id,
        contactId: contact?.id,
        channel: input.channel ?? "WHATSAPP",
        customerKey: input.customerKey ?? contact?.phone ?? "",
        orderNumber: input.orderNumber || generateOrderNumber(),
        modelName: input.modelName ?? "",
        size: input.size ?? "",
        quantity,
        unitPrice,
        deliveryCharge,
        totalAmount: calculateOrderTotal({ quantity, unitPrice, deliveryCharge }),
        customerName: input.customerName || contact?.name || "",
        customerPhone: input.customerPhone || contact?.phone || "",
        deliveryAddress: input.deliveryAddress ?? "",
        paymentStatus: normalizePaymentStatus(input.paymentStatus),
        orderStatus: normalizeOrderStatus(input.orderStatus),
        notes: input.notes ?? ""
      },
      include: { contact: { select: { id: true, name: true, phone: true, email: true, stage: true, tags: true } } }
    });

    return created({ order });
  } catch (error) {
    return handleApiError(error);
  }
}

async function getContactForCompany(companyId: string, contactId: string) {
  return prisma.contact.findFirstOrThrow({ where: { id: contactId, companyId } });
}

function parseLimit(value: string | null) {
  const parsed = Number(value ?? 100);
  if (!Number.isFinite(parsed)) return 100;
  return Math.min(Math.max(Math.floor(parsed), 1), 500);
}
