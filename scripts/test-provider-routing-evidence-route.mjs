import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const routeSource = readFileSync("app/api/admin/provider-routing-evidence/route.ts", "utf8");
const helperSource = readFileSync("lib/provider-routing-evidence.ts", "utf8");

assert.match(routeSource, /resolveAgentAuthorizedCompanyId\(request\)/, "route must require existing platform-admin or internal-token authorization");
assert.match(routeSource, /select:\s*{[\s\S]*payload:\s*true[\s\S]*}/, "route may select payload only for server-side aggregate classification");
assert.doesNotMatch(routeSource, /providerIdMasked|whatsappPhoneNumberId\s*[:,]|messengerPageId\s*[:,]|senderId\s*[:,]/, "route response must not expose provider IDs or sender IDs");
assert.doesNotMatch(helperSource, /providerIdMasked|senderId/, "helper output must not expose provider IDs or sender IDs");
assert.match(routeSource, /current-configuration exact matches are reported as zero/, "route must disclose current configuration limitation");

console.log("provider-routing-evidence route checks passed");
