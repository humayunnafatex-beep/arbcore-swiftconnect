import { z } from "zod";
import { handleApiError, ok, parseJson } from "@/lib/api";
import { requireAgentInternalToken } from "@/lib/agent-internal-auth";
import { APPROVED_AGENT_JOB_TYPES } from "@/lib/agent-job-registry";
import { runAgentJobWithRetry } from "@/lib/agent-orchestrator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  jobType: z.enum(APPROVED_AGENT_JOB_TYPES),
  idempotencyKey: z.string().trim().min(8).max(96),
  notify: z.boolean().optional().default(true)
});

export async function POST(request: Request) {
  try {
    const companyId = requireAgentInternalToken(request);
    const input = await parseJson(request, schema);

    const result = await runAgentJobWithRetry({
      companyId,
      jobType: input.jobType,
      idempotencyKey: input.idempotencyKey,
      notify: input.notify
    });

    return ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}
