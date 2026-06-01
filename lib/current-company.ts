import { ensureDefaultWorkspace, getCurrentAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentCompany() {
  // Beta behavior: keep the existing single-company/default workspace flow.
  // TODO: Replace with session-derived company selection before onboarding external clients.
  // TODO: For multi-client webhooks, route by provider account identifiers such as
  // WhatsApp Phone Number ID and verify token instead of first/default company fallback.
  const company = await prisma.company.findFirst({ orderBy: { createdAt: "asc" } });

  if (company) {
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
