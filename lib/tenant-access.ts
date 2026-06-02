import type { UserRole } from "@prisma/client";
import { getSafeAuthStatus, isAuthEnforced } from "@/lib/auth";
import { getCurrentCompany } from "@/lib/current-company";
import { isPermissionsEnforced } from "@/lib/permissions";
import { getSelectedWorkspaceId } from "@/lib/workspace-selection";

export type TenantAccessMode =
  | "user_company"
  | "beta_selected_workspace"
  | "beta_default_fallback"
  | "unauthenticated";

export type TenantAccessUser = {
  id: string;
  email: string;
  role: UserRole;
  companyId: string;
};

export function isTenantMembershipEnforced() {
  return process.env.TENANT_MEMBERSHIP_ENFORCED === "true";
}

export function validateUserCanAccessCompany(user: TenantAccessUser | null, companyId: string | null) {
  if (!user || !companyId) {
    return false;
  }

  // TODO: Support UserCompanyMembership and explicit support/admin access roles.
  return user.companyId === companyId;
}

export async function getTenantAccessContext() {
  const authEnforced = isAuthEnforced();
  const permissionsEnforced = isPermissionsEnforced();
  const tenantMembershipEnforced = isTenantMembershipEnforced();
  const selectedWorkspaceId = getSelectedWorkspaceId();
  const [authStatus, currentCompany] = await Promise.all([
    getSafeAuthStatus(),
    getCurrentCompany()
  ]);
  const currentCompanyId = currentCompany?.id ?? null;
  const user = buildTenantAccessUser(authStatus.prismaUser);
  const membershipValid = validateUserCanAccessCompany(user, currentCompanyId);
  const mode = resolveTenantAccessMode({
    hasUser: Boolean(user),
    selectedWorkspaceId,
    currentCompanyId,
    membershipValid,
    authMode: authStatus.mode
  });
  const warnings = buildWarnings({
    authEnforced,
    permissionsEnforced,
    tenantMembershipEnforced,
    mode,
    selectedWorkspaceId,
    user,
    currentCompanyId,
    membershipValid
  });

  return {
    authEnforced,
    permissionsEnforced,
    tenantMembershipEnforced,
    user,
    selectedWorkspaceId,
    selectedWorkspacePresent: Boolean(selectedWorkspaceId),
    currentCompanyId,
    currentCompany: currentCompany
      ? {
          id: currentCompany.id,
          name: currentCompany.name,
          slug: currentCompany.slug,
          plan: currentCompany.plan
        }
      : null,
    mode,
    membershipValid,
    warnings
  };
}

function buildTenantAccessUser(prismaUser: {
  exists: boolean;
  id: string | null;
  email: string | null;
  role: string | null;
  companyId: string | null;
}) {
  if (!prismaUser.exists || !prismaUser.id || !prismaUser.email || !prismaUser.role || !prismaUser.companyId) {
    return null;
  }

  return {
    id: prismaUser.id,
    email: prismaUser.email,
    role: prismaUser.role as UserRole,
    companyId: prismaUser.companyId
  };
}

function resolveTenantAccessMode({
  hasUser,
  selectedWorkspaceId,
  currentCompanyId,
  membershipValid,
  authMode
}: {
  hasUser: boolean;
  selectedWorkspaceId: string | null;
  currentCompanyId: string | null;
  membershipValid: boolean;
  authMode: "supabase_mapped" | "beta_fallback" | "unmapped" | "unauthenticated";
}): TenantAccessMode {
  if (selectedWorkspaceId && currentCompanyId === selectedWorkspaceId) {
    return "beta_selected_workspace";
  }

  if (authMode === "beta_fallback" && currentCompanyId) {
    return "beta_default_fallback";
  }

  if (hasUser && membershipValid) {
    return "user_company";
  }

  return "unauthenticated";
}

function buildWarnings({
  authEnforced,
  permissionsEnforced,
  tenantMembershipEnforced,
  mode,
  selectedWorkspaceId,
  user,
  currentCompanyId,
  membershipValid
}: {
  authEnforced: boolean;
  permissionsEnforced: boolean;
  tenantMembershipEnforced: boolean;
  mode: TenantAccessMode;
  selectedWorkspaceId: string | null;
  user: TenantAccessUser | null;
  currentCompanyId: string | null;
  membershipValid: boolean;
}) {
  const warnings: string[] = [];

  if (!authEnforced) {
    warnings.push("AUTH_ENFORCED is off. Tenant membership is report-only in beta.");
  }

  if (!permissionsEnforced) {
    warnings.push("PERMISSIONS_ENFORCED is off. Role permissions are not blocking beta users.");
  }

  if (!tenantMembershipEnforced) {
    warnings.push("TENANT_MEMBERSHIP_ENFORCED is off. This page reports readiness only.");
  }

  if (selectedWorkspaceId) {
    warnings.push("A beta selected workspace cookie is active. The cookie is not tenant security.");
  }

  if (user && currentCompanyId && !membershipValid) {
    warnings.push("Current company does not match the mapped user's company. Future enforcement should block this.");
  }

  if (!user && mode !== "beta_default_fallback") {
    warnings.push("No mapped Prisma user is available for tenant membership validation.");
  }

  if (tenantMembershipEnforced) {
    warnings.push("Tenant membership enforcement is enabled. Use only after staging verification.");
  }

  return warnings;
}
