import { getPagination, handleApiError, ok } from "@/lib/api";
import { getCurrentAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, pageSize, skip, take } = getPagination(searchParams);
    const contactId = searchParams.get("contactId") ?? undefined;
    const campaignId = searchParams.get("campaignId") ?? undefined;
    const direction = searchParams.get("direction") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const { company } = await getCurrentAuthContext();

    const where = {
      companyId: company.id,
      ...(contactId ? { contactId } : {}),
      ...(campaignId ? { campaignId } : {}),
      ...(direction ? { direction: direction as "INBOUND" | "OUTBOUND" } : {}),
      ...(status ? { status: status as "QUEUED" | "SENT" | "DELIVERED" | "READ" | "FAILED" | "RECEIVED" } : {})
    };

    const [items, total] = await Promise.all([
      prisma.messageLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: { contact: true, campaign: true, whatsappAccount: true }
      }),
      prisma.messageLog.count({ where })
    ]);

    return ok({ items, pagination: { page, pageSize, total } });
  } catch (error) {
    return handleApiError(error);
  }
}
