import { ensureDefaultWorkspace, getCurrentAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentCompany() {
  // Beta behavior: keep the existing single-company/default workspace flow.
  // TODO: Replace with session-derived company selection before onboarding external clients.
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
  return (await getCurrentAuthContext()).company;
}
