import { handleApiError, ok } from "@/lib/api";
import { getCurrentAuthContext, isAuthEnforced } from "@/lib/auth";
import { getPermissionsForRole, isPermissionsEnforced } from "@/lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const context = await getCurrentAuthContext();

    return ok({
      authEnforced: isAuthEnforced(),
      permissionsEnforced: isPermissionsEnforced(),
      user: {
        exists: Boolean(context.user),
        email: context.user.email ?? null,
        role: context.user.role ?? null
      },
      permissions: getPermissionsForRole(context.user.role)
    });
  } catch (error) {
    return handleApiError(error);
  }
}
