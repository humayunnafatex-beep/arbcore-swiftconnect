import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const matcherSource = readFileSync("lib/auto-reply-matcher.ts", "utf8")
  .replace(/import \{ prisma \} from "@\/lib\/prisma";/, "const prisma = {};");
const matcherUrl = `data:text/javascript;base64,${Buffer.from(ts.transpileModule(matcherSource, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022
  }
}).outputText).toString("base64")}`;
const {
  doesAutoReplyRuleMatch,
  evaluateAutoReplyPreflight,
  normalizeAutoReplyText
} = await import(matcherUrl);

assert.equal(normalizeAutoReplyText("  HeLLo  "), "hello");
assert.equal(doesAutoReplyRuleMatch({ keyword: "hello", matchMode: "EXACT" }, "hello"), true);
assert.equal(doesAutoReplyRuleMatch({ keyword: "hello", matchMode: "EXACT" }, "hello there"), false);
assert.equal(doesAutoReplyRuleMatch({ keyword: "hello", matchMode: "STARTS_WITH" }, "hello there"), true);
assert.equal(doesAutoReplyRuleMatch({ keyword: "hello", matchMode: "CONTAINS" }, "say hello there"), true);
assert.equal(doesAutoReplyRuleMatch({ keyword: "   ", matchMode: "CONTAINS" }, "anything"), false);

const calls = [];
const db = {
  autoReplyRule: {
    findMany: async (query) => {
      calls.push(query);
      return [
        { keyword: "known", matchMode: "EXACT" },
        { keyword: "prefix", matchMode: "STARTS_WITH" },
        { keyword: "needle", matchMode: "CONTAINS" }
      ];
    }
  }
};

const miss = await evaluateAutoReplyPreflight({
  companyId: "company-a",
  text: "arbc-messenger-routing-evidence-2026-10-08-9f4c2d7b",
  db
});
assert.deepEqual(miss, { activeRuleCount: 3, wouldMatch: false });
assert.equal(calls[0].where.companyId, "company-a");
assert.equal(calls[0].where.isActive, true);
assert.deepEqual(calls[0].orderBy, [{ priority: "asc" }, { createdAt: "asc" }]);
assert.equal(calls[0].take, 250);
assert.deepEqual(calls[0].select, { keyword: true, matchMode: true });

const hit = await evaluateAutoReplyPreflight({ companyId: "company-b", text: "prefix value", db });
assert.deepEqual(hit, { activeRuleCount: 3, wouldMatch: true });
assert.equal(calls[1].where.companyId, "company-b");

const handlerSource = readFileSync("lib/messenger-auto-reply-preflight-handler.ts", "utf8")
  .replace(/import \{ ApiError \} from "@\/lib\/api";/, `class ApiError extends Error { constructor(status, code, message) { super(message); this.status = status; this.code = code; } };`)
  .replace(/import \{ evaluateAutoReplyPreflight \} from "@\/lib\/auto-reply-matcher";/, "");
const handlerModuleUrl = `data:text/javascript;base64,${Buffer.from(ts.transpileModule(handlerSource, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022
  }
}).outputText).toString("base64")}`;
const { createMessengerAutoReplyPreflightGetHandler } = await import(handlerModuleUrl);

let evaluated = false;
const unauthorizedHandler = createMessengerAutoReplyPreflightGetHandler({
  authorize: async () => {
    throw new Error("blocked");
  },
  evaluate: async () => {
    evaluated = true;
    return { activeRuleCount: 0, wouldMatch: false };
  }
});
await assert.rejects(
  unauthorizedHandler(new Request("https://example.test/api/admin/messenger-auto-reply-preflight?text=synthetic")),
  /blocked/
);
assert.equal(evaluated, false, "unauthorized requests must stop before evaluation");

const authorizedHandler = createMessengerAutoReplyPreflightGetHandler({
  authorize: async () => ({ id: "company-a" }),
  now: () => new Date("2026-10-08T00:00:00.000Z"),
  evaluate: async ({ companyId, text }) => {
    assert.equal(companyId, "company-a");
    assert.equal(text, "secret-customer-message");
    return { activeRuleCount: 2, wouldMatch: false };
  }
});
const response = await authorizedHandler(new Request("https://example.test/api/admin/messenger-auto-reply-preflight?text=secret-customer-message"));
assert.equal(response.status, 200);
assert.equal(response.headers.get("Cache-Control"), "no-store, max-age=0");
assert.equal(response.headers.get("Pragma"), "no-cache");
const body = await response.json();
assert.equal(body.data.evaluationSucceeded, true);
assert.equal(body.data.activeRuleCount, 2);
assert.equal(body.data.wouldMatch, false);
assert.equal(body.data.configurationEvaluatedAt, "2026-10-08T00:00:00.000Z");
const serialized = JSON.stringify(body);
for (const forbidden of ["secret-customer-message", "keyword", "reply body", "rule-id", "token", "credential"]) {
  assert.equal(serialized.includes(forbidden), false, `response must not expose ${forbidden}`);
}

await assert.rejects(
  authorizedHandler(new Request("https://example.test/api/admin/messenger-auto-reply-preflight")),
  /Synthetic text is required/
);
await assert.rejects(
  authorizedHandler(new Request(`https://example.test/api/admin/messenger-auto-reply-preflight?text=${"a".repeat(281)}`)),
  /between 1 and 280/
);

const routeSource = readFileSync("app/api/admin/messenger-auto-reply-preflight/route.ts", "utf8");
assert.doesNotMatch(routeSource, /sendMessengerTextMessage|autoReplyEvent|messageLog|webhookEvent|fetch\(/, "preflight route must not import side-effect paths");

console.log("messenger-auto-reply-preflight tests passed");
