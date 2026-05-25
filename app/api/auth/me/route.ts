import { getCurrentAuthContext } from "@/lib/auth";
import { handleApiError, ok } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok(await getCurrentAuthContext());
  } catch (error) {
    return handleApiError(error);
  }
}
