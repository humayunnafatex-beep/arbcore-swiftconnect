import { handleApiError } from "@/lib/api";
import { resolveAgentAuthorizedCompanyId } from "@/lib/agent-internal-auth";
import { createMessengerAutoReplyPreflightGetHandler } from "@/lib/messenger-auto-reply-preflight-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const getMessengerAutoReplyPreflight = createMessengerAutoReplyPreflightGetHandler({
  authorize: async (request) => ({ id: await resolveAgentAuthorizedCompanyId(request) })
});

export async function GET(request: Request) {
  try {
    return await getMessengerAutoReplyPreflight(request);
  } catch (error) {
    return handleApiError(error);
  }
}
