import { handleApiError, ok } from "@/lib/api";
import { resolveAgentAuthorizedCompanyId } from "@/lib/agent-internal-auth";
import { createProviderRoutingEvidenceGetHandler } from "@/lib/provider-routing-evidence-route-handler";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const getProviderRoutingEvidence = createProviderRoutingEvidenceGetHandler({
  authorize: resolveAgentAuthorizedCompanyId,
  findEvents: ({ windowStart, limit }) => prisma.webhookEvent.findMany({
    where: {
      provider: { in: ["whatsapp", "messenger"] },
      createdAt: { gte: windowStart }
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      provider: true,
      payload: true,
      companyId: true,
      createdAt: true
    }
  })
});

export async function GET(request: Request) {
  try {
    return getProviderRoutingEvidence(request);
  } catch (error) {
    return handleApiError(error);
  }
}
