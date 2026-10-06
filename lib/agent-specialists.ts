import type { ApprovedAgentJobType } from "@/lib/agent-job-registry";

export const SPECIALIST_AGENT_IDS = [
  "SECURITY_SPECIALIST",
  "TENANT_SPECIALIST",
  "PROVIDER_SPECIALIST",
  "QA_SPECIALIST"
] as const;

export type SpecialistAgentId = (typeof SPECIALIST_AGENT_IDS)[number];

export type SpecialistAgentDefinition = {
  id: SpecialistAgentId;
  purpose: string;
  approvedJobs: ApprovedAgentJobType[];
};

export const SPECIALIST_AGENTS: Record<SpecialistAgentId, SpecialistAgentDefinition> = {
  SECURITY_SPECIALIST: {
    id: "SECURITY_SPECIALIST",
    purpose: "Validate production security enforcement and core runtime readiness.",
    approvedJobs: ["PRODUCTION_HEALTH_CHECK"]
  },
  TENANT_SPECIALIST: {
    id: "TENANT_SPECIALIST",
    purpose: "Validate tenant isolation readiness and company scoping.",
    approvedJobs: ["TENANT_ISOLATION_READINESS"]
  },
  PROVIDER_SPECIALIST: {
    id: "PROVIDER_SPECIALIST",
    purpose: "Validate WhatsApp and Messenger provider routing readiness.",
    approvedJobs: ["PROVIDER_ROUTING_READINESS"]
  },
  QA_SPECIALIST: {
    id: "QA_SPECIALIST",
    purpose: "Review specialist job outcomes and decide whether the plan may continue.",
    approvedJobs: []
  }
};

export function specialistForJob(jobType: ApprovedAgentJobType): SpecialistAgentId {
  if (jobType === "TENANT_ISOLATION_READINESS") return "TENANT_SPECIALIST";
  if (jobType === "PROVIDER_ROUTING_READINESS") return "PROVIDER_SPECIALIST";
  return "SECURITY_SPECIALIST";
}

// A duplicate marker alone is never evidence of specialist success.
export function reviewSpecialistResult(jobType: ApprovedAgentJobType, outcome: {
  completed: boolean;
  result: { jobType: ApprovedAgentJobType; ok: boolean; details: Record<string, string | number | boolean> } | null;
}) {
  const result = outcome.result;
  const d = result?.details;
  let passed = outcome.completed && result?.ok === true && result.jobType === jobType && Boolean(d);
  if (passed && d) {
    if (jobType === "PRODUCTION_HEALTH_CHECK") {
      passed = d.databaseReachable === true && d.authEnforced === true &&
        d.permissionsEnforced === true && d.tenantMembershipEnforced === true;
    } else if (jobType === "TENANT_ISOLATION_READINESS") {
      passed = d.authEnforced === true && d.permissionsEnforced === true &&
        d.tenantMembershipEnforced === true &&
        ["contactsWithoutCompany", "campaignsWithoutCompany", "conversationsWithoutCompany",
          "messageLogsWithoutCompany", "crmDealsWithoutCompany", "unscopedRecords"].every((key) => d[key] === 0);
    } else {
      passed = d.strictProviderRouting === true && d.duplicateWhatsappIds === 0 && d.duplicateMessengerIds === 0;
    }
  }
  return { specialist: "QA_SPECIALIST" as const, passed,
    reason: passed ? "Specialist evidence passed QA." : "Missing, failed, or inconsistent specialist evidence; continuation blocked." };
}
