import { handleApiError, ok } from "@/lib/api";
import { getTenantAccessContext } from "@/lib/tenant-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok(await getTenantAccessContext());
  } catch (error) {
    return handleApiError(error);
  }
}
