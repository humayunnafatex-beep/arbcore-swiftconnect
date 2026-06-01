import { NextResponse } from "next/server";
import { ApiError } from "@/lib/api";
import { getCurrentAuthContext, type AuthContext } from "@/lib/auth";
import { hasPermission, isPermissionsEnforced, type Permission } from "@/lib/permissions";

export type ApiGuardResult = {
  context: AuthContext;
  allowed: boolean;
  wouldAllow: boolean;
  permissionsEnforced: boolean;
};

export async function getAuthContext() {
  return getCurrentAuthContext();
}

export async function requirePermission(permission: Permission): Promise<ApiGuardResult> {
  const context = await getAuthContext();
  const permissionsEnforced = isPermissionsEnforced();
  const wouldAllow = hasPermission(context.user.role, permission);

  if (permissionsEnforced && !wouldAllow) {
    throw new ApiError(403, "FORBIDDEN", "Your role does not have permission for this action.");
  }

  return {
    context,
    allowed: permissionsEnforced ? wouldAllow : true,
    wouldAllow,
    permissionsEnforced
  };
}

export function createForbiddenResponse(message = "Your role does not have permission for this action.") {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "FORBIDDEN",
        message
      }
    },
    { status: 403 }
  );
}
