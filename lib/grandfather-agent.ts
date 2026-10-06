import { runAgentJobWithRetry } from "@/lib/agent-orchestrator";
import type { ApprovedAgentJobType } from "@/lib/agent-job-registry";
import { specialistForJob, type SpecialistAgentId } from "@/lib/agent-specialists";

export type GrandfatherPlanName =
  | "SECURITY_BASELINE"
  | "TENANT_READINESS"
  | "PROVIDER_READINESS"
  | "FULL_READINESS";

type GrandfatherStep = {
  specialist: SpecialistAgentId;
  jobType: ApprovedAgentJobType;
};

const PLANS: Record<GrandfatherPlanName, GrandfatherStep[]> = {
  SECURITY_BASELINE: [
    { specialist: "SECURITY_SPECIALIST", jobType: "PRODUCTION_HEALTH_CHECK" }
  ],
  TENANT_READINESS: [
    { specialist: "SECURITY_SPECIALIST", jobType: "PRODUCTION_HEALTH_CHECK" },
    { specialist: "TENANT_SPECIALIST", jobType: "TENANT_ISOLATION_READINESS" }
  ],
  PROVIDER_READINESS: [
    { specialist: "SECURITY_SPECIALIST", jobType: "PRODUCTION_HEALTH_CHECK" },
    { specialist: "PROVIDER_SPECIALIST", jobType: "PROVIDER_ROUTING_READINESS" }
  ],
  FULL_READINESS: [
    { specialist: "SECURITY_SPECIALIST", jobType: "PRODUCTION_HEALTH_CHECK" },
    { specialist: "TENANT_SPECIALIST", jobType: "TENANT_ISOLATION_READINESS" },
    { specialist: "PROVIDER_SPECIALIST", jobType: "PROVIDER_ROUTING_READINESS" }
  ]
};

export function getGrandfatherPlan(plan: GrandfatherPlanName) {
  return PLANS[plan].map((step) => ({
    ...step,
    specialist: specialistForJob(step.jobType)
  }));
}

export async function runGrandfatherPlan(input: {
  companyId: string;
  plan: GrandfatherPlanName;
  runId: string;
  notify?: boolean;
}) {
  const plan = getGrandfatherPlan(input.plan);
  const steps = [];

  for (let index = 0; index < plan.length; index += 1) {
    const step = plan[index];
    const result = await runAgentJobWithRetry({
      companyId: input.companyId,
      jobType: step.jobType,
      idempotencyKey: `${input.runId}:${index + 1}`,
      notify: input.notify
    });

    steps.push({
      step: index + 1,
      specialist: step.specialist,
      jobType: step.jobType,
      completed: result.completed,
      attempts: result.attempts,
      duplicate: result.duplicate,
      result: result.result,
      error: "error" in result ? result.error : undefined
    });

    if (!result.completed) {
      return {
        completed: false,
        qaPassed: false,
        stoppedAtStep: index + 1,
        steps,
        summary: `Grandfather Agent stopped because ${step.jobType} did not pass.`
      };
    }
  }

  return {
    completed: true,
    qaPassed: true,
    stoppedAtStep: null,
    steps,
    summary: "Grandfather Agent completed all approved specialist checks."
  };
}
