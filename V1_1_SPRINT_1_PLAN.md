# v1.1 Sprint 1 Plan

## Purpose

This plan selects the first implementation sprint from `V1_1_IMPLEMENTATION_BACKLOG.md`.

Sprint 1 focuses on P0/P1 hardening only. It does not expand product features, enable production flags, or change runtime behavior by itself.

Use this plan with:

- `V1_1_IMPLEMENTATION_BACKLOG.md`
- `V1_1_HARDENING_ROADMAP.md`
- `BETA_V1_DEPLOYMENT_READINESS.md`
- `BETA_V1_INTERNAL_DEPLOYMENT_RUNBOOK.md`
- `TENANT_ENFORCEMENT_STAGING_CHECKLIST.md`
- `ENFORCEMENT_FLAGS_REFERENCE.md`
- `STRICT_PROVIDER_WEBHOOK_ROUTING.md`
- `TECHNICAL_HANDOVER_INDEX.md`

## Sprint Goal

Prove that ARBCore SwiftConnect can safely move toward production SaaS hardening by validating auth/session behavior, workspace/tenant boundaries, enforcement flag safety, provider webhook routing, environment configuration, production verification reliability, and support/runbook alignment.

## Sprint Scope

- Auth/session verification.
- Workspace/tenant enforcement review.
- Enforcement flag safety review.
- Provider/Meta webhook routing review.
- Environment variable validation.
- Production verifier environment audit added to report required, optional, provider, billing, monitoring, and safe enforcement flag values by name/presence only.
- Production verification reliability.
- Support/runbook alignment.

## Out Of Scope

- Enabling production enforcement flags.
- Broad paid-client onboarding.
- Bulk campaign sending.
- Billing gateway automation.
- Plan limit enforcement.
- New product modules.
- Destructive database changes.

## Selected P0 Tasks

### Token Exposure Audit

- Source backlog item: Token Exposure Audit.
- Goal: Confirm tokens remain hidden across Settings, Logs, Diagnostics, support docs, and onboarding docs.
- Output: Findings list and fixes if any documentation copy is unsafe.

### Auth Enforcement Staging Test

- Source backlog item: Auth Enforcement Staging Test.
- Goal: Verify mapped Supabase admin login and public webhook safety in local/staging.
- Output: Staging result and any blockers before production auth enforcement.

### Tenant Membership Enforcement Staging Test

- Source backlog item: Tenant Membership Enforcement Staging Test.
- Goal: Validate user-to-company access expectations and selected workspace cookie safety in local/staging.
- Output: Tenant enforcement test result and blockers.

### Strict Provider Routing Staging Test

- Source backlog item: Strict Provider Routing Staging Test.
- Goal: Verify matched and unmatched WhatsApp/Messenger provider webhook behavior in local/staging.
- Output: Provider routing result and blockers.

## Selected P1 Tasks

### Triage Cadence And Ownership Setup

- Source backlog item: Triage Cadence And Ownership Setup.
- Goal: Confirm owners and review cadence for access, provider, billing, security, and documentation issues.
- Output: Owner list and cadence decision.

### Monitoring Access And Failure Review

- Source backlog item: Monitoring Access And Failure Review.
- Goal: Confirm technical owner can review Vercel/Supabase logs and failed message signals.
- Output: Monitoring access notes and gaps.

### Rollback Drill

- Source backlog item: Rollback Drill.
- Goal: Confirm operators understand Vercel rollback, Git revert, database non-reset, and enforcement flag rollback values.
- Output: Rollback drill record.

## Workstream Grouping

### Security And Access

- Token Exposure Audit.
- Auth Enforcement Staging Test.
- Tenant Membership Enforcement Staging Test.
- Enforcement flag safety review.

### Provider And Workspace

- Strict Provider Routing Staging Test.
- Provider diagnostics review.
- Workspace/tenant boundary review.

### Operations

- Environment variable validation.
- Production verification reliability.
- Monitoring access review.
- Rollback drill.
- Support/runbook alignment.

## Implementation Order

1. Confirm docs and environment flags remain safe.
2. Run token exposure audit.
3. Verify current production read-only checks.
4. Run local/staging auth enforcement test.
5. Run local/staging tenant membership enforcement test.
6. Run local/staging strict provider routing test.
7. Review provider diagnostics and workspace boundaries.
8. Confirm monitoring access.
9. Run rollback tabletop drill.
10. Record Sprint 1 outcome and blockers.

## Dependencies

- Supabase Auth test user and mapped Prisma user.
- Local or staging environment where enforcement flags can be safely changed.
- Access to Vercel logs.
- Access to Supabase logs.
- Safe webhook test payloads for WhatsApp and Messenger.
- `TENANT_ENFORCEMENT_STAGING_CHECKLIST.md`.
- `ENFORCEMENT_FLAGS_REFERENCE.md`.
- `STRICT_PROVIDER_WEBHOOK_ROUTING.md`.

## Risk Notes

- Do not test enforcement flags directly in production.
- Do not block Meta webhook routes during auth tests.
- Do not expose tokens in screenshots or issue logs.
- Do not treat beta selected workspace cookie as tenant security.
- Do not reset production database.
- Do not claim paid-client readiness from Sprint 1 alone.

## Verification Plan

Required commands:

```powershell
git status
npx prisma generate
npm.cmd run build
npm.cmd run verify:production
```

Manual checks:

- `/auth/status`
- `/auth/permissions`
- `/auth/tenant-access`
- `/admin/workspaces`
- `/admin/provider-diagnostics`
- `/channels`
- `/message-logs`
- Vercel logs access
- Supabase logs access

Staging checks:

- `AUTH_ENFORCED=true`
- `PERMISSIONS_ENFORCED=true`
- `TENANT_MEMBERSHIP_ENFORCED=true`
- `STRICT_PROVIDER_WEBHOOK_ROUTING=true`

Production defaults must remain:

```env
AUTH_ENFORCED=false
PERMISSIONS_ENFORCED=false
TENANT_MEMBERSHIP_ENFORCED=false
STRICT_PROVIDER_WEBHOOK_ROUTING=false
```

## Rollback Plan

- Revert code changes with Git if Sprint 1 introduces code changes in later implementation.
- Revert to previous Vercel deployment if a deployment issue appears.
- Do not reset production database.
- Keep enforcement rollback values false.
- Notify support owner before and after rollback.
- Run read-only production verifier after rollback.

## Definition Of Done

- All selected P0 tasks are tested or explicitly blocked with owner and reason.
- Selected P1 operational tasks are completed or consciously deferred.
- No production enforcement flag is enabled.
- No token exposure is found or unresolved.
- Production verifier passes.
- Support owner understands Sprint 1 findings.
- Sprint outcome is recorded.

## Sprint Exit Checklist

- [ ] Token exposure audit complete.
- [ ] Auth enforcement staging result recorded.
- [ ] Tenant enforcement staging result recorded.
- [ ] Strict provider routing staging result recorded.
- [ ] Enforcement flag safety reviewed.
- [ ] Provider diagnostics reviewed.
- [ ] Environment variable safety reviewed.
- [ ] Production verifier passes.
- [ ] Monitoring access confirmed or gaps recorded.
- [ ] Rollback drill completed.
- [ ] Support/runbook alignment reviewed.
- [ ] Sprint 1 blockers recorded.
- [ ] Next sprint recommendation recorded.
