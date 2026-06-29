import { handleApiError, ok } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { getDashboardAttentionCounts } from "@/lib/dashboard-attention";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { context } = await requirePermission("dashboard.view");
    const counts = await getDashboardAttentionCounts(context.company.id);

    return ok(counts);
  } catch (error) {
    return handleApiError(error);
  }
}
