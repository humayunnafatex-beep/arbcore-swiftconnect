import { ApiError, handleApiError, ok } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import {
  getOrderMessageTemplateLabel,
  normalizeOrderMessageTemplateId,
  renderOrderMessage
} from "@/lib/order-message-templates";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { context } = await requirePermission("orders.view");
    const { searchParams } = new URL(request.url);
    const templateId = normalizeOrderMessageTemplateId(searchParams.get("templateId"));
    const order = await prisma.order.findFirst({
      where: { id: params.id, companyId: context.company.id }
    });

    if (!order) {
      throw new ApiError(404, "ORDER_NOT_FOUND", "Order was not found.");
    }

    return ok({
      orderId: order.id,
      orderNumber: order.orderNumber,
      templateId,
      templateLabel: getOrderMessageTemplateLabel(templateId),
      message: renderOrderMessage(templateId, order)
    });
  } catch (error) {
    return handleApiError(error);
  }
}
