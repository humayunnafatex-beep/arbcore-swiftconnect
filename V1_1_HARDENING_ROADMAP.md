# v1.1 Hardening Roadmap

## Purpose

This roadmap defines the post-Beta v1.0 hardening plan before broader production use or paid-client expansion of ARBCore SwiftConnect.

Use this roadmap with:

- `BETA_V1_RELEASE_SUMMARY.md`
- `BETA_V1_SUCCESS_CRITERIA_AND_EXIT_PLAN.md`
- `BETA_V1_FEEDBACK_TRIAGE_WORKFLOW.md`
- `BETA_V1_ACCESS_CONTROL_PLAN.md`
- `BETA_V1_DEPLOYMENT_READINESS.md`
- `PAID_CLIENT_GO_LIVE_GATE.md`
- `TENANT_ENFORCEMENT_STAGING_CHECKLIST.md`
- `ENFORCEMENT_FLAGS_REFERENCE.md`
- `TECHNICAL_HANDOVER_INDEX.md`

This is a planning document. It does not enable production flags or change runtime behavior.

## Current Beta v1.0 Baseline

Beta v1.0 includes:

- Dashboard CRM/support metrics.
- Channel Center.
- WhatsApp send/receive/auto-reply when configured.
- Messenger send/receive/auto-reply foundation when configured.
- Unified Inbox CRM.
- Contacts and Auto Reply rules.
- Message Logs.
- Campaign drafts and audience preview without sending.
- Manual Billing, receipts, and report-only plan usage.
- Workspace onboarding and beta/admin workspace switching.
- Auth, permission, tenant membership, provider routing, and go-live readiness docs.

Safe defaults remain:

```env
AUTH_ENFORCED=false
PERMISSIONS_ENFORCED=false
TENANT_MEMBERSHIP_ENFORCED=false
STRICT_PROVIDER_WEBHOOK_ROUTING=false
```

## Roadmap Principles

- Do not break stable Beta v1.0 workflows.
- Harden access and tenant isolation before paid-client expansion.
- Keep provider success truthful and log-backed.
- Keep secrets hidden.
- Prefer staging verification before production enforcement.
- Keep rollback simple and documented.
- Treat client onboarding and support operations as product features, not afterthoughts.

## Security Hardening

- Verify no token exposure across Settings, Logs, Diagnostics, and Support workflows.
- Add or improve secret rotation guidance.
- Review webhook payload storage and safe summaries.
- Confirm access token fields remain server-only.
- Expand security QA around workspace isolation and provider routing.
- Create incident response templates for token exposure and wrong-workspace access.

## Authentication Hardening

- Complete mapped admin verification.
- Test `AUTH_ENFORCED=true` in local/staging.
- Confirm login/logout/session behavior.
- Confirm public webhook routes stay public.
- Document production auth rollout plan.
- Keep fallback behavior available only where safe.

## Workspace / Tenant Enforcement Hardening

- Complete `TENANT_ENFORCEMENT_STAGING_CHECKLIST.md`.
- Validate user-to-company access in staging.
- Confirm beta selected workspace cookie cannot override mapped user access under enforcement.
- Decide whether a single `User.companyId` model is enough for v1.1 or if membership tables are needed later.
- Prepare production rollout for `TENANT_MEMBERSHIP_ENFORCED=true` only after staging passes.
- Review global uniqueness constraints that may need tenant-aware changes.

## Provider / Meta / WhatsApp Hardening

- Confirm provider IDs are unique across workspaces.
- Run `/admin/provider-diagnostics` before strict routing tests.
- Test `STRICT_PROVIDER_WEBHOOK_ROUTING=true` in staging.
- Verify unmatched WhatsApp and Messenger provider events are acknowledged but not processed.
- Confirm Welzz Stride real WhatsApp number state.
- Review Messenger production app permissions and app review needs.
- Document provider failure patterns and support responses.

## Billing Hardening

- Tighten manual payment status handling.
- Confirm receipts remain safe and accurate.
- Decide when plan limits should move from report-only to enforced.
- Document paid-client billing operation flow.
- Prepare gateway automation requirements, but do not enable before provider verification.
- Add billing QA scenarios for disputes, pending payments, and corrections.

## Campaign Workflow Hardening

- Keep bulk campaign sending disabled until compliance controls are ready.
- Define template approval requirements.
- Plan queueing, rate limits, retry behavior, and unsubscribe/do-not-contact logic.
- Keep audience preview truthful and Contact-based.
- Add policy review before any real broadcast sending.

## Client Onboarding Hardening

- Use `BETA_V1_ACCESS_CONTROL_PLAN.md` for selected tester access.
- Require `PAID_CLIENT_GO_LIVE_GATE.md` before paid pilots.
- Create a repeatable client workspace setup checklist if beta demand increases.
- Improve client-facing limitation copy.
- Confirm support ownership and offboarding workflow.

## Support Operations Hardening

- Use `BETA_V1_FEEDBACK_TRIAGE_WORKFLOW.md`.
- Define issue owners for access, provider, billing, security, and docs.
- Review response expectations after internal beta.
- Add recurring beta review cadence.
- Improve common issue scripts for provider failures and access confusion.

## Monitoring And Analytics Hardening

- Review Vercel logs and Supabase logs access.
- Decide whether alerting is needed for failed messages, webhook errors, and provider failures.
- Add dashboard metrics only when they are reliable and useful.
- Track failed/attempted provider messages.
- Track high-priority feedback volume.

## Documentation Hardening

- Keep `TECHNICAL_HANDOVER_INDEX.md` current.
- Keep release, deployment, support, and access docs aligned.
- Remove outdated beta statements after v1.1 decisions.
- Add screenshots or short operator examples only if they improve support.
- Keep secret-handling warnings visible.

## QA And Verification Hardening

- Expand manual QA from route checks to workflow checks.
- Keep `npm.cmd run verify:production` read-only.
- Add staging-only enforcement test records.
- Re-test Dashboard, Channel Center, Inbox, Message Logs, Settings, Contacts, Auto Reply, Campaigns, Billing, and License.
- Include access, tenant, provider, and billing scenarios.

## Performance Hardening

- Review slow dashboard or log queries.
- Add indexes only after measuring query patterns.
- Keep log list limits reasonable.
- Review large Contacts and Message Logs behavior.
- Avoid adding background sending or queues until requirements are clear.

## Rollback And Recovery Hardening

- Confirm Vercel rollback process.
- Confirm Git revert process.
- Confirm database rollback is forward-fix oriented and never destructive.
- Keep enforcement flag rollback values documented:

```env
AUTH_ENFORCED=false
PERMISSIONS_ENFORCED=false
TENANT_MEMBERSHIP_ENFORCED=false
STRICT_PROVIDER_WEBHOOK_ROUTING=false
```

- Test rollback communication path with support owner.

## v1.1 Acceptance Criteria

v1.1 is ready when:

- Beta v1.0 blocker issues are resolved or explicitly accepted.
- Auth enforcement is verified in staging.
- Permission enforcement is verified in staging.
- Tenant membership behavior is verified in staging.
- Strict provider routing behavior is verified in staging.
- Provider IDs are unique.
- Support triage workflow is active.
- Paid-client go-live requirements are clear.
- Production verifier passes.
- Manual smoke tests pass.
- Rollback plan is ready.

## Items Intentionally Out Of Scope

- Broad public SaaS launch.
- Bulk campaign sending without compliance controls.
- Automated payment gateway without payment provider verification.
- Full plan limit enforcement without client billing readiness.
- Multi-workspace user membership unless required by paid pilot scope.
- Replacing all beta fallback behavior before staging proves the new paths.

## Suggested Work Sequence

1. Review Beta v1.0 feedback and blockers.
2. Complete security and token exposure review.
3. Complete auth enforcement staging test.
4. Complete permission enforcement staging test.
5. Complete tenant membership staging test.
6. Complete strict provider routing staging test.
7. Resolve provider ID and workspace issues.
8. Harden client onboarding and support workflows.
9. Decide paid pilot scope.
10. Prepare v1.1 acceptance review.

## Final v1.1 Readiness Gate

```text
v1.1 readiness decision:
Decision owner:
Business owner:
Technical owner:
Support owner:
Open blockers:
Accepted limitations:
Paid pilot readiness: Yes/No
Production expansion readiness: Yes/No
Next action:
Date:
```
