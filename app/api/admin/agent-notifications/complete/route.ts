import { z } from "zod";
import { ApiError, handleApiError, ok, parseJson } from "@/lib/api";
import { sendAgentCompletionNotification } from "@/lib/agent-notification";
import { resolveAgentAuthorizedCompanyId } from "@/lib/agent-internal-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  task: z.string().trim().min(2).max(200),
  status: z.enum(["COMPLETED", "FAILED", "NEEDS_ATTENTION"]).optional(),
  summary: z.string().trim().max(800).optional(),
  nextJob: z.string().trim().max(400).optional()
});

export async function POST(request: Request) {
  try {
    const companyId = await resolveAgentAuthorizedCompanyId(request);
    const input = await parseJson(request, schema);
    const recipient = (process.env.AGENT_COMPLETION_WHATSAPP_TO || "").replace(/[^\d]/g, "");

    if (!recipient) {
      throw new ApiError(
        503,
        "AGENT_NOTIFICATION_NOT_CONFIGURED",
        "Agent completion WhatsApp recipient is not configured."
      );
    }

    const result = await sendAgentCompletionNotification({
      companyId,
      recipient,
      task: input.task,
      status: input.status,
      summary: input.summary,
      nextJob: input.nextJob
    });

    if (!result.success) {
      throw new ApiError(
        502,
        "AGENT_NOTIFICATION_SEND_FAILED",
        result.reason === "not_configured"
          ? "WhatsApp sender settings are not configured for this workspace."
          : "WhatsApp provider rejected the agent completion notification."
      );
    }

    return ok({
      sent: true,
      providerMessageId: result.providerMessageId ?? null
    });
  } catch (error) {
    return handleApiError(error);
  }
}
