import { ensureDefaultWorkspace, getCurrentAuthContext, isAuthEnforced } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSelectedWorkspaceId } from "@/lib/workspace-selection";

export async function getCurrentCompany() {
  // Production SaaS behavior: when auth is enforced, company context must come
  // only from the authenticated mapped user. Never fall back to a selected
  // workspace cookie or the first/default company.
  if (isAuthEnforced()) {
    return getAuthenticatedCurrentCompany();
  }

  // Beta/admin-only behavior while AUTH_ENFORCED=false.
  const selectedWorkspaceId = getSelectedWorkspaceId();

  if (selectedWorkspaceId) {
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
    // Beta mode may not have an authenticated Supabase session.
  }

  return getBetaFallbackCompany();
}

export async function getCurrentCompanyId() {
  return (await getCurrentCompany()).id;
}

export async function getAuthenticatedCurrentCompany() {
  return (await getCurrentAuthContext()).company;
}

// Explicit beta-only fallback for public provider webhook compatibility.
// Do not use this helper for authenticated SaaS/API request company resolution.
export async function getBetaFallbackCompany() {
  const company = await prisma.company.findFirst({ orderBy: { createdAt: "asc" } });

  if (company) {
    return company;
  }

  return (await ensureDefaultWorkspace()).company;
}
