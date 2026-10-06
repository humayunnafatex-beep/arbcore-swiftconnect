import { prisma } from "@/lib/prisma";
import { findDuplicateProviderIds, hasProviderIdValue } from "@/lib/provider-id-validation";

export const APPROVED_AGENT_JOB_TYPES = [
  "PRODUCTION_HEALTH_CHECK",
  "TENANT_ISOLATION_READINESS",
  "PROVIDER_ROUTING_READINESS"
] as const;

export type ApprovedAgentJobType = (typeof APPROVED_AGENT_JOB_TYPES)[number];

export type AgentJobResult = {
  jobType: ApprovedAgentJobType;
  ok: boolean;
  summary: string;
  details: Record<string, string | number | boolean>;
};

export function isApprovedAgentJobType(value: unknown): value is ApprovedAgentJobType {
  return typeof value === "string" && APPROVED_AGENT_JOB_TYPES.includes(value as ApprovedAgentJobType);
}

export async function runApprovedAgentJob(jobType: ApprovedAgentJobType): Promise<AgentJobResult> {
  switch (jobType) {
    case "PRODUCTION_HEALTH_CHECK":
      return runProductionHealthCheck();
    case "TENANT_ISOLATION_READINESS":
      return runTenantIsolationReadiness();
    case "PROVIDER_ROUTING_READINESS":
      return runProviderRoutingReadiness();
  }
}

async function runProductionHealthCheck(): Promise<AgentJobResult> {
  await prisma.$queryRaw`SELECT 1`;

  const authEnforced = process.env.AUTH_ENFORCED === "true";
  const permissionsEnforced = process.env.PERMISSIONS_ENFORCED === "true";
  const tenantMembershipEnforced = process.env.TENANT_MEMBERSHIP_ENFORCED === "true";
  const ok = authEnforced && permissionsEnforced && tenantMembershipEnforced;

  return {
    jobType: "PRODUCTION_HEALTH_CHECK",
    ok,
    summary: ok
      ? "Database connectivity and production security enforcement checks passed."
      : "Database is reachable, but one or more production security enforcement flags are not enabled.",
    details: {
      databaseReachable: true,
      authEnforced,
      permissionsEnforced,
      tenantMembershipEnforced
    }
  };
}

async function runTenantIsolationReadiness(): Promise<AgentJobResult> {
  const [
    contactsWithoutCompany,
    campaignsWithoutCompany,
    conversationsWithoutCompany,
    messageLogsWithoutCompany,
    crmDealsWithoutCompany
  ] = await Promise.all([
    prisma.contact.count({ where: { companyId: null } }),
    prisma.campaign.count({ where: { companyId: null } }),
    prisma.conversation.count({ where: { companyId: null } }),
    prisma.messageLog.count({ where: { companyId: null } }),
    prisma.crmDeal.count({ where: { companyId: null } })
  ]);

  const authEnforced = process.env.AUTH_ENFORCED === "true";
  const permissionsEnforced = process.env.PERMISSIONS_ENFORCED === "true";
  const tenantMembershipEnforced = process.env.TENANT_MEMBERSHIP_ENFORCED === "true";
  const unscopedRecords =
    contactsWithoutCompany +
    campaignsWithoutCompany +
    conversationsWithoutCompany +
    messageLogsWithoutCompany +
    crmDealsWithoutCompany;
  const ok =
    authEnforced &&
    permissionsEnforced &&
    tenantMembershipEnforced &&
    unscopedRecords === 0;

  return {
    jobType: "TENANT_ISOLATION_READINESS",
    ok,
    summary: ok
      ? "Tenant enforcement is active and audited nullable tenant records are fully company-scoped."
      : "Tenant readiness needs attention because enforcement or company scoping is incomplete.",
    details: {
      authEnforced,
      permissionsEnforced,
      tenantMembershipEnforced,
      contactsWithoutCompany,
      campaignsWithoutCompany,
      conversationsWithoutCompany,
      messageLogsWithoutCompany,
      crmDealsWithoutCompany,
      unscopedRecords
    }
  };
}

async function runProviderRoutingReadiness(): Promise<AgentJobResult> {
  const companies = await prisma.company.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      plan: true,
      whatsappPhoneNumberId: true,
      messengerPageId: true
    }
  });

  const whatsappDuplicates = findDuplicateProviderIds(companies, "whatsappPhoneNumberId");
  const messengerDuplicates = findDuplicateProviderIds(companies, "messengerPageId");
  const whatsappConfigured = companies.filter((company) => hasProviderIdValue(company.whatsappPhoneNumberId)).length;
  const messengerConfigured = companies.filter((company) => hasProviderIdValue(company.messengerPageId)).length;
  const strictProviderRouting = process.env.STRICT_PROVIDER_WEBHOOK_ROUTING === "true";
  const duplicates = whatsappDuplicates.length + messengerDuplicates.length;
  const ok = duplicates === 0;

  return {
    jobType: "PROVIDER_ROUTING_READINESS",
    ok,
    summary: ok
      ? "Provider identifiers have no detected cross-workspace duplicates."
      : "Duplicate provider identifiers must be resolved before strict webhook routing is enabled.",
    details: {
      workspaceCount: companies.length,
      whatsappConfigured,
      messengerConfigured,
      duplicateWhatsappIds: whatsappDuplicates.length,
      duplicateMessengerIds: messengerDuplicates.length,
      strictProviderRouting
    }
  };
}
