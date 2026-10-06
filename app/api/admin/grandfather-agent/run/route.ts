import { z } from "zod";
import { handleApiError, ok, parseJson } from "@/lib/api";
import { requireAgentInternalToken } from "@/lib/agent-internal-auth";
import { runGrandfatherPlan } from "@/lib/grandfather-agent";

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
