import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const source = readFileSync("lib/provider-routing-evidence.ts", "utf8");
const moduleUrl = pathToFileURL("lib/provider-routing-evidence.ts").href;
const {
  summarizeProviderRoutingEvidence,
  evidenceActivationStatus
} = await import(moduleUrl);

const now = new Date("2026-10-07T00:00:00.000Z");
const events = [
  {
    provider: "whatsapp",
    companyId: "company-a",
    createdAt: now,
    payload: { routing: { matched: true, routedBy: "WHATSAPP_PHONE_NUMBER_ID", whatsappPhoneNumberIdPresent: true } }
  },
  {
    provider: "whatsapp",
    companyId: null,
    createdAt: now,
    payload: { routing: { matched: false, routedBy: "UNMATCHED_PROVIDER", whatsappPhoneNumberIdPresent: true } }
  },
  {
    provider: "messenger",
    companyId: "company-a",
    createdAt: now,
    payload: { routing: { matched: true, routedBy: "MESSENGER_PAGE_ID", messengerPageIdPresent: true } }
  },
  {
    provider: "messenger",
    companyId: "company-a",
    createdAt: now,
    payload: { routing: { matched: false, routedBy: "BETA_FALLBACK", messengerPageIdPresent: false } }
  },
  {
    provider: "messenger",
    companyId: "company-a",
    createdAt: now,
    payload: { provider: "messenger" }
  }
];

const [whatsapp, messenger] = summarizeProviderRoutingEvidence(events);
assert.equal(whatsapp.inspectedCount, 2);
assert.equal(whatsapp.providerIdPresentCount, 2);
assert.equal(whatsapp.historicalMatchedCount, 1);
assert.equal(whatsapp.unmatchedCount, 1);
assert.equal(whatsapp.currentConfigurationMatchedCount, 0);
assert.equal(whatsapp.currentConfigurationMatchEvidence, "UNAVAILABLE");
assert.equal(whatsapp.ambiguousCount, null);
assert.equal(whatsapp.ambiguityEvidence, "UNAVAILABLE");
assert.equal(evidenceActivationStatus(whatsapp), "INSUFFICIENT_EVIDENCE");

assert.equal(messenger.inspectedCount, 3);
assert.equal(messenger.providerIdPresentCount, 1);
assert.equal(messenger.historicalMatchedCount, 1);
assert.equal(messenger.missingCount, 1);
assert.equal(messenger.unknownOrUnclassifiableCount, 2);
assert.equal(messenger.currentConfigurationMatchedCount, 0);
assert.equal(messenger.currentConfigurationMatchEvidence, "UNAVAILABLE");
assert.equal(messenger.ambiguousCount, null);
assert.equal(messenger.ambiguityEvidence, "UNAVAILABLE");

const [emptyWhatsapp, emptyMessenger] = summarizeProviderRoutingEvidence([]);
assert.equal(evidenceActivationStatus(emptyWhatsapp), "INSUFFICIENT_EVIDENCE");
assert.equal(evidenceActivationStatus(emptyMessenger), "INSUFFICIENT_EVIDENCE");

assert.ok(!source.includes("providerIdMasked"), "helper must not expose masked provider IDs");
console.log("provider-routing-evidence tests passed");
