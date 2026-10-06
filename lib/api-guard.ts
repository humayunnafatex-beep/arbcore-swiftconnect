import { NextResponse } from "next/server";
import { ApiError } from "@/lib/api";
import { getCurrentAuthContext, type AuthContext } from "@/lib/auth";
import { hasPermission, isPermissionsEnforced, type Permission } from "@/lib/permissions";

export type ApiGuardResult = {
  context: AuthContext;
  allowed: boolean;
  wouldAllow: boolean;
  permissionsEnforced: boolean;
  tenantMembershipEnforced: boolean;
};

export async function getAuthContext() {
  return getCurrentAuthContext();
}

export function isTenantMembershipEnforced() {
  return process.env.TENANT_MEMBERSHIP_ENFORCED === "true";
}

export async function requirePermission(permission: Permission): Promise<ApiGuardResult> {
  const context = await getAuthContext();
  const permissionsEnforced = isPermissionsEnforced();
  const tenantMembershipEnforced = isTenantMembershipEnforced();
  const wouldAllow = hasPermission(context.user.role, permission);
  const tenantMatches = context.user.companyId === context.company.id;

  if (tenantMembershipEnforced && !tenantMatches) {
    throw new ApiError(
      403,
      "TENANT_ACCESS_DENIED",
      "Your account is not allowed to access this company workspace."
    );
  }

  if (permissionsEnforced && !wouldAllow) {
    throw new ApiError(403, "FORBIDDEN", "You do not have permission to perform this action.");
  }

  return {
    context,
    allowed: permissionsEnforced ? wouldAllow : true,
    wouldAllow,
    permissionsEnforced,
    tenantMembershipEnforced
  };
}

export function createForbiddenResponse(message = "You do not have permission to perform this action.") {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code: "FORBIDDEN"
    },
    { status: 403 }
  );
}
