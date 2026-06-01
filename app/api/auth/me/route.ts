import { getSafeAuthStatus } from "@/lib/auth";
import { handleApiError, ok } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok(await getSafeAuthStatus());
  } catch (error) {
    return handleApiError(error);
  }
}
