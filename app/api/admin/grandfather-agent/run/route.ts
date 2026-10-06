import { z } from "zod";
import { handleApiError, ok, parseJson } from "@/lib/api";
import { requireAgentInternalToken } from "@/lib/agent-internal-auth";
import { getGrandfatherPlan, runGrandfatherPlan } from "@/lib/grandfather-agent";

import { runApprovedAgentJob } from "@/lib/agent-job-registry";
import { reviewSpecialistResult } from "@/lib/agent-specialists";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  plan: z.enum(["SECURITY_BASELINE", "TENANT_READINESS", "PROVIDER_READINESS", "FULL_READINESS"]),
  runId: z.string().trim().min(8).max(80),
  notify: z.boolean().optional().default(true)
});

export async function POST(request: Request) {
  try {
    const companyId = requireAgentInternalToken(request);
    const input = await parseJson(request, schema);

    const result = await runGrandfatherPlan({
      companyId,
      plan: input.plan,
      runId: input.runId,
      notify: input.notify
    });

    return ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}

// Safe readiness expansion: reads only, no audit inserts, retries, chaining, or notifications.
export async function GET(request: Request) {
  try {
    requireAgentInternalToken(request);
    const planName = schema.shape.plan.parse(new URL(request.url).searchParams.get("plan") ?? "FULL_READINESS");
    const plan = getGrandfatherPlan(planName);
    const steps = [];
    for (const step of plan) {
      let result = null;
      try { result = await runApprovedAgentJob(step.jobType); } catch { /* Stop safely below. */ }
      const qa = reviewSpecialistResult(step.jobType, { completed: result?.ok === true, result });
      steps.push({ ...step, result, qa });
      if (!qa.passed) break;
    }
    const passed = steps.filter((step) => step.qa.passed).length;
    return ok({ mode: "READ_ONLY", plan: planName, qaPassed: passed === plan.length,
      stoppedAtStep: passed === plan.length ? null : steps.length,
      aggregation: { passed, failed: steps.length - passed, skipped: plan.length - steps.length }, steps });
  } catch (error) {
    return handleApiError(error);
  }
}
