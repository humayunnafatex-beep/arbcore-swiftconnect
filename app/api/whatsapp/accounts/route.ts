import { created, getPagination, handleApiError, ok, parseJson } from "@/lib/api";
import { getCurrentAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { whatsappAccountCreateSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, pageSize, skip, take } = getPagination(searchParams);
    const status = searchParams.get("status") || undefined;
    const { company } = await getCurrentAuthContext();
    const companyId = company.id;

    const where = {
      companyId,
      ...(status ? { status: status as "CONNECTED" | "PENDING" | "DISCONNECTED" } : {})
    };
    const [items, total] = await Promise.all([
      prisma.whatsAppAccount.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
      prisma.whatsAppAccount.count({ where })
    ]);

    return ok({ items, pagination: { page, pageSize, total } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, whatsappAccountCreateSchema);
    const { company } = await getCurrentAuthContext();
    const account = await prisma.whatsAppAccount.create({
      data: {
        companyId: company.id,
        label: input.label,
        phoneNumber: input.phoneNumber,
        businessName: input.businessName ?? undefined,
        status: input.status ?? "PENDING",
        qualityRating: input.qualityRating ?? "UNKNOWN",
        dailyLimit: input.dailyLimit ?? 10000
      }
    });

    return created(account);
  } catch (error) {
    return handleApiError(error);
  }
}
