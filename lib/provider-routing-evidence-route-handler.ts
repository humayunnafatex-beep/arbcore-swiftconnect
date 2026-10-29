import {
  evidenceActivationStatus,
  summarizeProviderRoutingEvidence,
  type ProviderRoutingEvidenceEvent
} from "@/lib/provider-routing-evidence";

type ProviderRoutingEvidenceHandlerDeps = {
  authorize: (request: Request) => Promise<unknown>;
  findEvents: (input: {
    windowStart: Date;
    limit: number;
  }) => Promise<ProviderRoutingEvidenceEvent[]>;
  now?: () => Date;
};

const MAX_LIMIT = 500;
const DEFAULT_LIMIT = 200;
const DEFAULT_WINDOW_DAYS = 30;
const MAX_WINDOW_DAYS = 90;

export function createProviderRoutingEvidenceGetHandler(deps: ProviderRoutingEvidenceHandlerDeps) {
  return async function GET(request: Request) {
    await deps.authorize(request);

    const { searchParams } = new URL(request.url);
    const limit = parseBoundedInteger(searchParams.get("limit"), DEFAULT_LIMIT, 1, MAX_LIMIT);
    const windowDays = parseBoundedInteger(searchParams.get("windowDays"), DEFAULT_WINDOW_DAYS, 1, MAX_WINDOW_DAYS);
    const now = deps.now?.() ?? new Date();
    const windowStart = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
    const events = await deps.findEvents({ windowStart, limit });
    const summaries = summarizeProviderRoutingEvidence(events);
    const inspectedCount = summaries.reduce((total, summary) => total + summary.inspectedCount, 0);

    return Response.json({
      success: true,
      data: {
        timeWindowUtc: {
          start: windowStart.toISOString(),
          end: now.toISOString(),
          requestedDays: windowDays
        },
        query: {
          limit,
          returned: events.length,
          truncated: events.length === limit
        },
        strictModeActivationEvidence: summaries.every((summary) => evidenceActivationStatus(summary) === "HISTORICAL_MATCH_EVIDENCE")
          ? "HISTORICAL_MATCH_EVIDENCE_ONLY"
          : "INSUFFICIENT_EVIDENCE",
        inspectedCount,
        providers: summaries.map((summary) => ({
          ...summary,
          activationEvidence: evidenceActivationStatus(summary)
        })),
        limitations: [
          "This endpoint returns aggregate routing evidence only.",
          "It does not return provider IDs, sender IDs, message bodies, raw payloads, tokens, credentials, or customer data.",
          "Historical matches are distinguished from current-configuration matches; current-configuration exact matches are not verifiable because raw provider IDs are not stored.",
          "Ambiguity classification is not verifiable from stored evidence because raw provider IDs and candidate match counts are not stored.",
          "Use this evidence as one readiness input only; it does not enable strict mode or prove live concurrency."
        ]
      }
    });
  };
}

function parseBoundedInteger(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.floor(parsed), min), max);
}
