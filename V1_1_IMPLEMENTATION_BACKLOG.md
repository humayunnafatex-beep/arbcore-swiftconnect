# v1.1 Implementation Backlog

## Purpose

This backlog converts `V1_1_HARDENING_ROADMAP.md` into actionable implementation tasks for the v1.1 hardening phase.

Use this backlog with:

- `V1_1_HARDENING_ROADMAP.md`
- `BETA_V1_SUCCESS_CRITERIA_AND_EXIT_PLAN.md`
- `BETA_V1_FEEDBACK_TRIAGE_WORKFLOW.md`
- `BETA_V1_ACCESS_CONTROL_PLAN.md`
- `TENANT_ENFORCEMENT_STAGING_CHECKLIST.md`
- `ENFORCEMENT_FLAGS_REFERENCE.md`
- `PAID_CLIENT_GO_LIVE_GATE.md`
- `TECHNICAL_HANDOVER_INDEX.md`

This is a planning document. It does not enable production flags or change runtime behavior.

## Backlog Item Template

Use this shape when adding or expanding tasks:

```text
Task title:
Objective:
Type: Code / Config / Documentation / QA / Ops
Priority: P0 / P1 / P2
Owner:
Dependencies:
Acceptance criteria:
Verification command or manual test:
Status:
```

## Security

### Token Exposure Audit

- Task title: Audit token exposure across Settings, Logs, Diagnostics, and docs.
- Objective: Confirm WhatsApp and Messenger tokens never appear in UI, APIs, logs, screenshots, or docs.
- Type: QA / Security
- Priority: P0
- Owner: TBD
- Dependencies: `BETA_V1_FEEDBACK_TRIAGE_WORKFLOW.md`, `SUPPORT_HANDOVER_NOTE.md`
- Acceptance criteria: No route or doc exposes access tokens; risky support wording is corrected.
- Verification command or manual test: `npm.cmd run build`; manually check Settings, Channel Center, Message Logs, Provider Diagnostics, Support docs.
- Status: Not started

## Authentication

### Auth Enforcement Staging Test

- Task title: Run staged `AUTH_ENFORCED=true` test.
- Objective: Verify mapped Supabase admin login before any production auth enforcement.
- Type: QA / Config
- Priority: P0
- Owner: TBD
- Dependencies: `AUTH_ENFORCEMENT_TEST_CHECKLIST.md`, `SUPABASE_ADMIN_USER_MAPPING.md`, `ENFORCEMENT_FLAGS_REFERENCE.md`
- Acceptance criteria: `/auth/status` shows mapped `OWNER` or `ADMIN`; protected app routes work for mapped admin; webhook routes remain public.
- Verification command or manual test: Set `AUTH_ENFORCED=true` in local/staging, run `npm.cmd run build`, test `/login`, `/dashboard`, `/auth/status`, provider webhook GET verification.
- Status: Not started

## Workspace / Tenant Enforcement

### Tenant Membership Enforcement Staging Test

- Task title: Validate tenant membership enforcement in staging.
- Objective: Confirm users can access only assigned workspaces before paid-client expansion.
- Type: QA / Config / Code
- Priority: P0
- Owner: TBD
- Dependencies: `TENANT_ENFORCEMENT_STAGING_CHECKLIST.md`, `BETA_V1_ACCESS_CONTROL_PLAN.md`, `ENFORCEMENT_FLAGS_REFERENCE.md`
- Acceptance criteria: Mapped user accesses own workspace; mapped user cannot access another workspace; beta selected workspace cookie cannot override mapped user under enforcement.
- Verification command or manual test: Set `TENANT_MEMBERSHIP_ENFORCED=true` in local/staging, test `/auth/tenant-access`, `/admin/workspaces`, Dashboard, Inbox, Message Logs.
- Status: Not started

## Provider / Meta / WhatsApp

### Strict Provider Routing Staging Test

- Task title: Validate strict provider webhook routing in staging.
- Objective: Confirm matched provider IDs route correctly and unmatched provider events are acknowledged without processing.
- Type: QA / Config
- Priority: P0
- Owner: TBD
- Dependencies: `STRICT_PROVIDER_WEBHOOK_ROUTING.md`, `PROVIDER_ID_UNIQUENESS_PLAN.md`, `ENFORCEMENT_FLAGS_REFERENCE.md`
- Acceptance criteria: Matched WhatsApp and Messenger events route to correct workspace; unmatched events return 200 without customer `MessageLog` or Auto Reply.
- Verification command or manual test: Set `STRICT_PROVIDER_WEBHOOK_ROUTING=true` in local/staging, run matched/unmatched WhatsApp and Messenger webhook tests, inspect logs safely.
- Status: Not started

## Billing

### Manual Billing Hardening Review

- Task title: Review manual billing, receipts, and report-only plan usage.
- Objective: Ensure billing records are safe and clear before paid pilots.
- Type: QA / Documentation
- Priority: P1
- Owner: TBD
- Dependencies: `PAID_CLIENT_GO_LIVE_GATE.md`, `PAYMENT_SUBSCRIPTION_PLAN.md`
- Acceptance criteria: Pending vs confirmed payment meaning is clear; receipts expose no secrets/card data; plan usage remains report-only.
- Verification command or manual test: Manual test `/billing`, payment history, receipt page, and plan usage; run `npm.cmd run build`.
- Status: Not started

## Campaign Workflow

### Campaign Sending Readiness Definition

- Task title: Define requirements before any campaign sending.
- Objective: Keep campaigns draft/audience-preview only until compliance, template, queue, and rate-limit controls are planned.
- Type: Documentation / Product
- Priority: P1
- Owner: TBD
- Dependencies: `BETA_V1_SUCCESS_CRITERIA_AND_EXIT_PLAN.md`, Meta policy requirements
- Acceptance criteria: Campaign sending requirements are documented; no send/broadcast UI is enabled; audience preview remains truthful.
- Verification command or manual test: Review `/campaigns`; confirm no bulk send path is presented to users.
- Status: Not started

## Client Onboarding

### Paid Pilot Onboarding Checklist Hardening

- Task title: Convert paid pilot steps into repeatable onboarding checklist.
- Objective: Make selected client onboarding repeatable without relying on informal operator memory.
- Type: Documentation / Ops
- Priority: P1
- Owner: TBD
- Dependencies: `BETA_V1_ACCESS_CONTROL_PLAN.md`, `CLIENT_ONBOARDING_GUIDE.md`, `PAID_CLIENT_GO_LIVE_GATE.md`
- Acceptance criteria: Required client info, workspace setup, provider setup, billing, support, and offboarding steps are covered.
- Verification command or manual test: Dry-run with a mock selected beta client; review checklist with support owner.
- Status: Not started

## Support Operations

### Triage Cadence And Ownership Setup

- Task title: Establish beta issue review cadence and owners.
- Objective: Ensure feedback, bugs, security concerns, access issues, and provider issues are reviewed on schedule.
- Type: Ops
- Priority: P1
- Owner: TBD
- Dependencies: `BETA_V1_FEEDBACK_TRIAGE_WORKFLOW.md`, `SUPPORT_HANDOVER_NOTE.md`
- Acceptance criteria: Issue owners are assigned; review cadence is documented; S1/P0 escalation path is known.
- Verification command or manual test: Run one mock triage review using the final triage log template.
- Status: Not started

## Monitoring And Analytics

### Monitoring Access And Failure Review

- Task title: Confirm operators can review production logs and failed message signals.
- Objective: Improve visibility into route failures, provider failures, and message health.
- Type: Ops / QA
- Priority: P1
- Owner: TBD
- Dependencies: Vercel access, Supabase access, Message Logs
- Acceptance criteria: Technical owner can access Vercel/Supabase logs; failed message review process is documented.
- Verification command or manual test: Run `npm.cmd run verify:production`; inspect Vercel logs and `/message-logs` filters.
- Status: Not started

## Documentation

### Documentation Consistency Pass

- Task title: Align Beta v1.0 docs with v1.1 hardening decisions.
- Objective: Remove stale statements and keep handover docs consistent as hardening decisions are made.
- Type: Documentation
- Priority: P2
- Owner: TBD
- Dependencies: `TECHNICAL_HANDOVER_INDEX.md`, v1.1 decisions
- Acceptance criteria: README, technical index, launch checklist, support handover, and onboarding docs reference current gates.
- Verification command or manual test: `rg` for outdated flags/status text; manual doc review.
- Status: Not started

## QA And Verification

### v1.1 Manual Workflow QA Pass

- Task title: Expand manual QA from route checks to workflow checks.
- Objective: Verify critical business workflows before v1.1 readiness.
- Type: QA
- Priority: P1
- Owner: TBD
- Dependencies: `PRODUCTION_MANUAL_QA_CHECKLIST.md`, `TENANT_ENFORCEMENT_STAGING_CHECKLIST.md`
- Acceptance criteria: Dashboard, Channel Center, Inbox, Message Logs, Settings, Contacts, Auto Reply, Campaigns, Billing, and License workflows pass.
- Verification command or manual test: `npm.cmd run build`, `npm.cmd run verify:production`, manual workflow checklist.
- Status: Not started

## Performance

### Log And Dashboard Query Review

- Task title: Review dashboard and log query behavior under larger beta data.
- Objective: Identify slow or risky queries before paid-client expansion.
- Type: QA / Code
- Priority: P2
- Owner: TBD
- Dependencies: Representative beta data, dashboard statistics API, logs API
- Acceptance criteria: No obvious slow route under expected beta data; index changes are documented if needed.
- Verification command or manual test: Manual route timing review for `/dashboard`, `/message-logs`, `/api/dashboard/statistics`, `/api/whatsapp/logs`.
- Status: Not started

## Rollback And Recovery

### Rollback Drill

- Task title: Run a safe rollback tabletop drill.
- Objective: Confirm operators understand Vercel rollback, Git revert, and database non-reset rules.
- Type: Ops / QA
- Priority: P1
- Owner: TBD
- Dependencies: `BETA_V1_INTERNAL_DEPLOYMENT_RUNBOOK.md`, `BETA_V1_DEPLOYMENT_READINESS.md`
- Acceptance criteria: Rollback owner can describe steps; no destructive DB action is part of rollback; enforcement flag fallback values are known.
- Verification command or manual test: Tabletop drill with business, technical, and support owner.
- Status: Not started

## P0 Release Blockers

- Token, secret, cookie, raw session, or private customer data exposure.
- Wrong workspace data visible to another user/client.
- Provider send misrouted or sent to wrong recipient.
- Auth/permission/tenant enforcement staging fails with no workaround.
- Strict provider routing staging fails with no safe workaround.
- Production verifier fails with no explanation.

## P1 Hardening Tasks

- Manual billing hardening review.
- Campaign sending readiness definition.
- Paid pilot onboarding checklist hardening.
- Triage cadence and ownership setup.
- Monitoring access and failure review.
- v1.1 manual workflow QA pass.
- Rollback drill.

## P2 Polish / Follow-Up Tasks

- Documentation consistency pass.
- Log and dashboard query review.
- Additional operator examples or screenshots if support needs them.
- Client-facing limitation wording polish.

## Suggested Sprint Grouping

### Sprint 1: Enforcement And Security Gate

- Token exposure audit.
- Auth enforcement staging test.
- Tenant membership enforcement staging test.
- Strict provider routing staging test.

### Sprint 2: Operational Hardening

- Manual billing hardening review.
- Triage cadence and ownership setup.
- Monitoring access and failure review.
- Rollback drill.

### Sprint 3: Client And Product Readiness

- Paid pilot onboarding checklist hardening.
- Campaign sending readiness definition.
- v1.1 manual workflow QA pass.
- Documentation consistency pass.

## v1.1 Readiness Checklist

- [ ] No P0 release blockers remain open.
- [ ] P1 hardening tasks are complete or consciously deferred.
- [ ] Auth enforcement staging test passed.
- [ ] Permission enforcement staging test passed.
- [ ] Tenant enforcement staging test passed.
- [ ] Strict provider routing staging test passed.
- [ ] Provider diagnostics show no duplicate IDs.
- [ ] Support triage workflow is active.
- [ ] Paid-client go-live gate is updated.
- [ ] Production verifier passes.
- [ ] Manual workflow QA passes.
- [ ] Rollback path is understood.
- [ ] v1.1 readiness decision is recorded in `V1_1_HARDENING_ROADMAP.md`.
