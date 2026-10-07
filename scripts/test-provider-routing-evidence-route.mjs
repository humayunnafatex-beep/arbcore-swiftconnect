import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const routeSource = readFileSync("app/api/admin/provider-routing-evidence/route.ts", "utf8");
const helperSource = readFileSync("lib/provider-routing-evidence.ts", "utf8");
const helperModuleUrl = pathToFileURL("lib/provider-routing-evidence.ts").href;
const handlerSource = readFileSync("lib/provider-routing-evidence-route-handler.ts", "utf8")
  .replace(/from "@\/lib\/provider-routing-evidence";/, `from "${helperModuleUrl}";`);
const handlerModuleUrl = `data:text/javascript;base64,${Buffer.from(ts.transpileModule(handlerSource, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022
  }
}).outputText).toString("base64")}`;
const { createProviderRoutingEvidenceGetHandler } = await import(handlerModuleUrl);

assert.match(routeSource, /authorize:\s*resolveAgentAuthorizedCompanyId/, "route must require existing platform-admin or internal-token authorization");
assert.match(routeSource, /select:\s*{[\s\S]*payload:\s*true[\s\S]*}/, "route may select payload only for server-side aggregate classification");
assert.doesNotMatch(routeSource, /providerIdMasked|whatsappPhoneNumberId\s*[:,]|messengerPageId\s*[:,]|senderId\s*[:,]/, "route response must not expose provider IDs or sender IDs");
assert.doesNotMatch(helperSource, /providerIdMasked|senderId/, "helper output must not expose provider IDs or sender IDs");
assert.match(routeSource, /createProviderRoutingEvidenceGetHandler/, "route should delegate to the executable evidence handler");

let dbTouched = false;
const unauthorizedHandler = createProviderRoutingEvidenceGetHandler({
  authorize: async () => {
    throw Object.assign(new Error("blocked"), { status: 401 });
  },
  findEvents: async () => {
    dbTouched = true;
    return [];
  }
});
await assert.rejects(
  unauthorizedHandler(new Request("https://example.test/api/admin/provider-routing-evidence")),
  /blocked/
);
assert.equal(dbTouched, false, "unauthorized requests must stop before database access");

const secretPayload = {
  routing: {
    matched: true,
    routedBy: "WHATSAPP_PHONE_NUMBER_ID",
    whatsappPhoneNumberIdPresent: true
  },
  entry: [{
    id: "raw-provider-id",
    changes: [{
      value: {
        messages: [{ from: "sender-id", text: { body: "private message" } }],
        metadata: { phone_number_id: "provider-phone-number-id" }
      }
    }]
  }],
  token: "secret-token"
};
const authorizedHandler = createProviderRoutingEvidenceGetHandler({
  authorize: async () => "ok",
  now: () => new Date("2026-10-08T00:00:00.000Z"),
  findEvents: async () => [{
    provider: "whatsapp",
    companyId: "company-a",
    createdAt: new Date("2026-10-07T00:00:00.000Z"),
    payload: secretPayload
  }]
});
const response = await authorizedHandler(new Request("https://example.test/api/admin/provider-routing-evidence?windowDays=30&limit=10"));
assert.equal(response.status, 200);
const body = await response.json();
assert.equal(body.success, true);
assert.equal(body.data.inspectedCount, 1);
assert.equal(body.data.providers[0].historicalMatchedCount, 1);
assert.equal(body.data.providers[0].currentConfigurationMatchedCount, 0);
assert.equal(body.data.providers[0].currentConfigurationMatchEvidence, "UNAVAILABLE");
assert.equal(body.data.providers[0].ambiguousCount, null);
assert.equal(body.data.providers[0].ambiguityEvidence, "UNAVAILABLE");
const serialized = JSON.stringify(body);
for (const forbidden of ["raw-provider-id", "sender-id", "private message", "provider-phone-number-id", "secret-token", "entry", "changes", "messages"]) {
  assert.equal(serialized.includes(forbidden), false, `response must not expose ${forbidden}`);
}

console.log("provider-routing-evidence route checks passed");
