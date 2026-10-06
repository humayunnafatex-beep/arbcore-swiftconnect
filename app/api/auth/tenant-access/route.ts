import { handleApiError, ok } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { getTenantAccessContext } from "@/lib/tenant-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePermission("settings.view");
    return ok(await getTenantAccessContext());
  } catch (error) {
    return handleApiError(error);
  }
}
