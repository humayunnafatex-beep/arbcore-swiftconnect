import type { Prisma } from "@prisma/client";

export type ProviderRoutingEvidenceProvider = "whatsapp" | "messenger";

export type ProviderRoutingEvidenceEvent = {
  provider: string;
  payload: Prisma.JsonValue;
  companyId: string | null;
  createdAt: Date;
};

export type ProviderRoutingEvidenceSummary = {
  provider: ProviderRoutingEvidenceProvider;
  inspectedCount: number;
  providerIdPresentCount: number;
  historicalMatchedCount: number;
  currentConfigurationMatchedCount: number;
  currentConfigurationMatchEvidence: "UNAVAILABLE";
  missingCount: number;
  unmatchedCount: number;
  ambiguousCount: number | null;
  ambiguityEvidence: "UNAVAILABLE";
  unknownOrUnclassifiableCount: number;
  latestTimestamp: string | null;
  evidenceSource: string;
  coverageLimitations: string[];
};

type RoutingMetadata = {
  routedBy?: unknown;
  matched?: unknown;
  whatsappPhoneNumberIdPresent?: unknown;
  messengerPageIdPresent?: unknown;
};

export function summarizeProviderRoutingEvidence(events: ProviderRoutingEvidenceEvent[]) {
  const summaries: ProviderRoutingEvidenceSummary[] = [
    emptySummary("whatsapp"),
    emptySummary("messenger")
  ];
  const byProvider = new Map(summaries.map((summary) => [summary.provider, summary]));

  for (const event of events) {
    if (event.provider !== "whatsapp" && event.provider !== "messenger") continue;

    const summary = byProvider.get(event.provider);
    if (!summary) continue;

    summary.inspectedCount += 1;
    if (!summary.latestTimestamp || event.createdAt.toISOString() > summary.latestTimestamp) {
      summary.latestTimestamp = event.createdAt.toISOString();
    }

    const routing = getRoutingMetadata(event.payload);
    if (!routing) {
      summary.unknownOrUnclassifiableCount += 1;
      continue;
    }

    const providerIdPresent = event.provider === "whatsapp"
      ? routing.whatsappPhoneNumberIdPresent === true
      : routing.messengerPageIdPresent === true;

    if (providerIdPresent) {
      summary.providerIdPresentCount += 1;
    } else {
      summary.missingCount += 1;
    }

    if (routing.matched === true) {
      summary.historicalMatchedCount += 1;
      continue;
    }

    if (routing.routedBy === "UNMATCHED_PROVIDER") {
      summary.unmatchedCount += 1;
      continue;
    }

    if (routing.routedBy === "BETA_FALLBACK") {
      summary.unknownOrUnclassifiableCount += 1;
      continue;
    }

    summary.unknownOrUnclassifiableCount += 1;
  }

  return summaries;
}

export function evidenceActivationStatus(summary: ProviderRoutingEvidenceSummary) {
  if (summary.inspectedCount === 0) return "INSUFFICIENT_EVIDENCE";
  if (
    summary.historicalMatchedCount > 0 &&
    summary.missingCount === 0 &&
    summary.unmatchedCount === 0 &&
    summary.ambiguousCount === null &&
    summary.unknownOrUnclassifiableCount === 0
  ) {
    return "HISTORICAL_MATCH_EVIDENCE";
  }
  return "INSUFFICIENT_EVIDENCE";
}

function emptySummary(provider: ProviderRoutingEvidenceProvider): ProviderRoutingEvidenceSummary {
  return {
    provider,
    inspectedCount: 0,
    providerIdPresentCount: 0,
    historicalMatchedCount: 0,
    currentConfigurationMatchedCount: 0,
    currentConfigurationMatchEvidence: "UNAVAILABLE",
    missingCount: 0,
    unmatchedCount: 0,
    ambiguousCount: null,
    ambiguityEvidence: "UNAVAILABLE",
    unknownOrUnclassifiableCount: 0,
    latestTimestamp: null,
    evidenceSource: "WebhookEvent.payload.routing aggregate metadata",
    coverageLimitations: [
      "Stored webhook evidence intentionally keeps provider identifiers redacted.",
      "Historical matched counts prove the webhook write path matched a company at event time.",
      "Current configuration exact recompare is unavailable because raw provider IDs are not stored in WebhookEvent routing metadata.",
      "Ambiguous duplicate-match classification is unavailable from stored webhook routing metadata because raw provider IDs and candidate match counts are not stored.",
      "Zero inspected events or beta fallback events are insufficient for strict-mode activation."
    ]
  };
}

function getRoutingMetadata(payload: Prisma.JsonValue): RoutingMetadata | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const routing = (payload as Record<string, unknown>).routing;
  if (!routing || typeof routing !== "object" || Array.isArray(routing)) return null;
  return routing as RoutingMetadata;
}
