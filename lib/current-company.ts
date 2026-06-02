import { ensureDefaultWorkspace, getCurrentAuthContext, isAuthEnforced } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSelectedWorkspaceId } from "@/lib/workspace-selection";

export async function getCurrentCompany() {
  // Beta behavior: keep the existing single-company/default workspace flow.
  // Phase 4: if a Supabase Auth user maps to a Prisma user, use that user's company.
  // TODO: Make authenticated user/session company resolution the default before onboarding external clients.
  // TODO: In production SaaS mode, workspace switching must validate user membership/role.
  // TODO: For multi-client webhooks, route by provider account identifiers such as
  // WhatsApp Phone Number ID and verify token instead of first/default company fallback.
  if (isAuthEnforced()) {
    try {
      const authenticatedCompany = await getAuthenticatedCurrentCompany();
      if (authenticatedCompany) {
        return authenticatedCompany;
      }
    } catch {
      // Public provider webhooks do not have browser sessions. Keep beta fallback for now.
    }
  }

  const selectedWorkspaceId = getSelectedWorkspaceId();

  if (selectedWorkspaceId) {
    // Beta/admin testing only: this intentionally honors the selected workspace cookie.
    // TODO: Future production should call tenant access validation before honoring
    // this cookie. The selected workspace cookie is not tenant security.
    const selectedCompany = await prisma.company.findUnique({ where: { id: selectedWorkspaceId } });

    if (selectedCompany) {
      return selectedCompany;
    }
  }

  try {
    const authenticatedCompany = await getAuthenticatedCurrentCompany();
    if (authenticatedCompany) {
      return authenticatedCompany;
    }
  } catch {
    // Public provider webhooks do not have browser sessions. Keep beta fallback for now.
  }

  const company = await prisma.company.findFirst({ orderBy: { createdAt: "asc" } });

  if (company) {
    // TODO: Production SaaS should not use default fallback for untrusted clients.
    return company;
  }

  return (await ensureDefaultWorkspace()).company;
}

export async function getCurrentCompanyId() {
  return (await getCurrentCompany()).id;
}

export async function getAuthenticatedCurrentCompany() {
  // TODO: Use this as the default path after real auth/session company binding is implemented.
  // Future behavior should resolve company from authenticated user/session membership.
  return (await getCurrentAuthContext()).company;
}
