import { runAgentJobWithRetry } from "@/lib/agent-orchestrator";
import type { ApprovedAgentJobType } from "@/lib/agent-job-registry";
import { specialistForJob, reviewSpecialistResult, type SpecialistAgentId } from "@/lib/agent-specialists";

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
    let result;
    try {
      result = await runAgentJobWithRetry({
        companyId: input.companyId,
        jobType: step.jobType,
        idempotencyKey: `gf:${input.plan}:${input.runId}:${index + 1}`,
        notify: input.notify
      });
    } catch {
      result = { completed: false, attempts: 0, duplicate: false, result: null,
        error: "Specialist execution unavailable; plan stopped safely." };
    }
    const qa = reviewSpecialistResult(step.jobType, result);

    steps.push({
      step: index + 1,
      specialist: step.specialist,
      jobType: step.jobType,
      completed: result.completed,
      qa,
      attempts: result.attempts,
      duplicate: result.duplicate,
      result: result.result,
      error: "error" in result ? result.error : undefined
    });

    if (!qa.passed) {
      return {
        completed: false,
        qaPassed: false,
        stoppedAtStep: index + 1,
        steps,
        aggregation: { passed: steps.filter((entry) => entry.qa.passed).length, failed: 1, skipped: plan.length - steps.length },
        summary: `Grandfather Agent stopped because ${step.jobType} did not pass.`
      };
    }
  }

  return {
    completed: true,
    qaPassed: true,
    stoppedAtStep: null,
    steps,
    aggregation: { passed: steps.length, failed: 0, skipped: 0 },
    summary: "Grandfather Agent completed all approved specialist checks."
  };
}
