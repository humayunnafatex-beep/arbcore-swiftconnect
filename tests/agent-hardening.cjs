// Isolated production-module tests: no database, network, or messaging access.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
function load(name, mocks = {}) {
  const code = ts.transpileModule(fs.readFileSync(name.startsWith("app/") ? name : `lib/${name}.ts`, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require: id => {
    if (id in mocks) return mocks[id];
    if (id.startsWith('@/')) throw Error(`Unmocked import: ${id}`);
    return require(id);
  }, Buffer, URL, process: { env: {} }, setTimeout: fn => { fn(); } }, { filename: name });
  return module.exports;
}
const specialists = load('agent-specialists');
const details = {
  PRODUCTION_HEALTH_CHECK: { databaseReachable: true, authEnforced: true, permissionsEnforced: true, tenantMembershipEnforced: true },
  TENANT_ISOLATION_READINESS: { authEnforced: true, permissionsEnforced: true, tenantMembershipEnforced: true, contactsWithoutCompany: 0, campaignsWithoutCompany: 0, conversationsWithoutCompany: 0, messageLogsWithoutCompany: 0, crmDealsWithoutCompany: 0, unscopedRecords: 0 },
  PROVIDER_ROUTING_READINESS: { strictProviderRouting: true, duplicateWhatsappIds: 0, duplicateMessengerIds: 0 }
};
const evidence = jobType => ({ jobType, ok: true, summary: 'passed', details: details[jobType] });
function harness(run) {
  const logs = [], locks = new Set(); let calls = 0;
  const prisma = { $transaction: async fn => {
    let lock; const staged = [];
    const tx = {
      $queryRaw: async (_strings, key) => { if (locks.has(String(key))) return [{ acquired: false }]; lock = String(key); locks.add(lock); return [{ acquired: true }]; },
      activityLog: {
        findFirst: async ({ where }) => [...logs].reverse().find(x => x.companyId === where.companyId && x.entityId === where.entityId && where.action.in.includes(x.action)),
        create: async ({ data }) => { staged.push(data); return data; }
      }
    };
    try { const value = await fn(tx); logs.push(...staged); return value; }
    finally { if (lock) locks.delete(lock); }
  }};
  class ApiError extends Error { constructor(status, code, message) { super(message); this.status = status; this.code = code; } }
  const orchestrator = load('agent-orchestrator', {
    '@/lib/agent-specialists': specialists, '@/lib/prisma': { prisma }, '@/lib/api': { ApiError },
    '@/lib/agent-notification': { sendAgentCompletionNotification: () => { throw Error('Messaging forbidden'); } },
    '@/lib/agent-job-registry': { isApprovedAgentJobType: x => x in details, runApprovedAgentJob: async job => { calls++; return run ? run(job, calls) : evidence(job); } }
  });
  const grandfather = load('grandfather-agent', { '@/lib/agent-orchestrator': orchestrator, '@/lib/agent-specialists': specialists });
  return { ...orchestrator, ...grandfather, logs, calls: () => calls };
}
const input = { companyId: 'tenant-a', jobType: 'PRODUCTION_HEALTH_CHECK', idempotencyKey: 'qa-run-001', notify: false };
for (const job of Object.keys(details)) {
  test(`${job}: validates complete evidence and rejects every missing field`, () => {
    assert.equal(specialists.reviewSpecialistResult(job, { completed: true, result: evidence(job) }).passed, true);
    for (const key of Object.keys(details[job])) {
      const result = evidence(job); result.details = { ...result.details }; delete result.details[key];
      assert.equal(specialists.reviewSpecialistResult(job, { completed: true, result }).passed, false);
    }
  });
}
test('duplicate without evidence and wrong job never pass QA', () => {
  assert.equal(specialists.reviewSpecialistResult(input.jobType, { completed: true, result: null }).passed, false);
  assert.equal(specialists.reviewSpecialistResult(input.jobType, { completed: true, result: evidence('PROVIDER_ROUTING_READINESS') }).passed, false);
});
test('FULL_READINESS aggregates all specialist results and replay uses persisted evidence', async () => {
  const h = harness(); const request = { companyId: 'tenant-a', plan: 'FULL_READINESS', runId: 'full-run-001', notify: false };
  const first = await h.runGrandfatherPlan(request); assert.equal(first.qaPassed, true); assert.equal(first.aggregation.passed, 3);
  const duplicate = await h.runGrandfatherPlan(request); assert.equal(duplicate.qaPassed, true); assert.equal(h.calls(), 3);
  assert.ok(duplicate.steps.every(x => x.duplicate && x.result && x.qa.passed));
});
test('failure exhausts bounded retries and stops subsequent specialists; replay stays stopped', async () => {
  const h = harness(job => job === 'TENANT_ISOLATION_READINESS' ? { ...evidence(job), ok: false } : evidence(job));
  const request = { companyId: 'tenant-a', plan: 'FULL_READINESS', runId: 'failed-run-001', notify: false };
  const value = await h.runGrandfatherPlan(request); assert.equal(value.completed, false); assert.equal(value.stoppedAtStep, 2);
  assert.equal(value.aggregation.skipped, 1); assert.equal(h.calls(), 4);
  await h.runGrandfatherPlan(request); assert.equal(h.calls(), 4);
});
test('exception fails safely without leaking diagnostic secrets', async () => {
  const h = harness(() => { throw Error('private-token'); });
  const value = await h.runGrandfatherPlan({ companyId: 'tenant-a', plan: 'FULL_READINESS', runId: 'exception-001', notify: false });
  assert.equal(value.stoppedAtStep, 1); assert.equal(JSON.stringify(value).includes('private-token'), false);
});
test('concurrent duplicate receives conflict and executes only once', async () => {
  let release, started; const start = new Promise(resolve => started = resolve);
  const h = harness(async job => { started(); await new Promise(resolve => release = resolve); return evidence(job); });
  const first = h.runAgentJobWithRetry(input); await start;
  await assert.rejects(h.runAgentJobWithRetry(input), error => error.status === 409);
  release(); await first; assert.equal(h.calls(), 1);
  const replay = await h.runAgentJobWithRetry(input); assert.equal(replay.duplicate, true); assert.equal(h.calls(), 1);
});
test('tenant scope and long idempotency suffixes cannot collide', async () => {
  const h = harness();
  await h.runAgentJobWithRetry(input); await h.runAgentJobWithRetry({ ...input, companyId: 'tenant-b' });
  await h.runAgentJobWithRetry({ ...input, idempotencyKey: 'x'.repeat(145) + 'a' });
  await h.runAgentJobWithRetry({ ...input, idempotencyKey: 'x'.repeat(145) + 'b' });
  assert.equal(h.calls(), 4); assert.ok(h.logs.every(x => x.entityId.length <= 128));
});
test('legacy completion blocks without rerunning', async () => {
  const h = harness(); h.logs.push({ companyId: input.companyId, entityId: `${input.jobType}:${input.idempotencyKey}`, action: 'AGENT_JOB_COMPLETED', metadataSummary: 'databaseReachable=true' });
  const result = await h.runAgentJobWithRetry(input); assert.equal(result.completed, false); assert.equal(h.calls(), 0);
});
test('plan namespaces prevent cross-plan key reuse', async () => {
  const h = harness();
  for (const plan of ['SECURITY_BASELINE', 'FULL_READINESS']) await h.runGrandfatherPlan({ companyId: 'tenant-a', plan, runId: 'shared-run-001', notify: false });
  assert.equal(h.calls(), 4);
});
test('invalid approved job is rejected before any execution', async () => {
  const h = harness(); await assert.rejects(h.runAgentJobWithRetry({ ...input, jobType: 'SEND_MESSAGE' }), error => error.status === 400); assert.equal(h.calls(), 0);
});

test('read-only readiness GET validates evidence without orchestrator or writes', async () => {
  let calls = 0;
  const h = harness();
  const route = load('app/api/admin/grandfather-agent/run/route.ts', {
    '@/lib/api': { ok: value => value, handleApiError: error => ({ error: error.message }) },
    '@/lib/agent-internal-auth': { requireAgentInternalToken: () => 'tenant-a' },
    '@/lib/grandfather-agent': { getGrandfatherPlan: h.getGrandfatherPlan, runGrandfatherPlan: () => { throw Error('Writes forbidden'); } },
    '@/lib/agent-specialists': specialists,
    '@/lib/agent-job-registry': { runApprovedAgentJob: async job => { calls++; return evidence(job); } }
  });
  const result = await route.GET({ url: 'https://example.test/api?plan=FULL_READINESS' });
  assert.equal(result.mode, 'READ_ONLY'); assert.equal(result.qaPassed, true); assert.equal(calls, 3); assert.equal(h.logs.length, 0);
});
test('transient job failure retries then persists one success', async () => {
  const h = harness((job, calls) => { if (calls === 1) throw Error('transient'); return evidence(job); });
  const result = await h.runAgentJobWithRetry(input); assert.equal(result.completed, true); assert.equal(result.attempts, 2);
  assert.equal(h.logs.filter(x => x.action === 'AGENT_JOB_COMPLETED').length, 1);
});
test('corrupt cached details fail closed in the orchestrator', async () => {
  const h = harness(); const result = evidence(input.jobType); result.details = {};
  h.logs.push({ companyId: input.companyId, entityId: `${input.jobType}:${input.idempotencyKey}`, action: 'AGENT_JOB_COMPLETED', metadataSummary: JSON.stringify(result) });
  assert.equal((await h.runAgentJobWithRetry(input)).completed, false); assert.equal(h.calls(), 0);
});
