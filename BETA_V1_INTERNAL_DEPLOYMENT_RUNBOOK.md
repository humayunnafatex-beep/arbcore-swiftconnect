# Beta v1.0 Internal Deployment Runbook

## Purpose

Use this runbook to deploy or validate ARBCore SwiftConnect Enterprise Beta v1.0 from the tagged release and current `main` documentation.

This runbook is for internal operators. It does not enable production enforcement flags and does not change runtime behavior.

## Release Reference

- Release tag: `v1.0.0-beta`
- Tag message: `Enterprise Beta v1.0 release`
- Release summary: `BETA_V1_RELEASE_SUMMARY.md`
- Deployment readiness: `BETA_V1_DEPLOYMENT_READINESS.md`
- Stakeholder review: `BETA_V1_STAKEHOLDER_REVIEW_CHECKLIST.md`
- Launch checklist: `LAUNCH_CHECKLIST.md`
- Support handover: `SUPPORT_HANDOVER_NOTE.md`
- Technical index: `TECHNICAL_HANDOVER_INDEX.md`

## Pre-Deployment Requirements

- [ ] `v1.0.0-beta` tag exists and is pushed to origin.
- [ ] `main` is clean and aligned with `origin/main`.
- [ ] `BETA_V1_DEPLOYMENT_READINESS.md` is reviewed.
- [ ] `BETA_V1_STAKEHOLDER_REVIEW_CHECKLIST.md` is completed or decision notes are recorded.
- [ ] Deployment operator has Vercel access.
- [ ] Deployment operator has Supabase read/admin access appropriate for verification.
- [ ] Rollback owner is identified.
- [ ] Support owner is available for post-deployment review.

## Environment Variable Verification

Confirm production environment values in Vercel:

- [ ] `DATABASE_URL` is present and production-safe.
- [ ] `DIRECT_URL` is present and production-safe.
- [ ] `NEXT_PUBLIC_APP_URL` matches the production app URL.
- [ ] `SESSION_SECRET` is present and private.
- [ ] Supabase public auth values are present only if auth testing requires them.
- [ ] Meta provider secrets are present only when real channel tests are approved.
- [ ] No secrets are committed to Git.

Confirm safe default flags:

```env
AUTH_ENFORCED=false
PERMISSIONS_ENFORCED=false
TENANT_MEMBERSHIP_ENFORCED=false
STRICT_PROVIDER_WEBHOOK_ROUTING=false
```

## Database / Prisma Preparation

- [ ] Review `SUPABASE_PRODUCTION_MIGRATION_CHECKLIST.md`.
- [ ] Confirm production Supabase database is reachable.
- [ ] Confirm backups/export process is understood.
- [ ] Do not run `prisma migrate reset`.
- [ ] Do not reset production database.
- [ ] Run Prisma generate locally:

```powershell
npx prisma generate
```

- [ ] If migrations are pending, use a controlled migration/deploy process only.

## Build Verification

Run:

```powershell
npm.cmd run build
```

Expected:

- [ ] Prisma Client generates.
- [ ] Next.js build compiles.
- [ ] TypeScript checks pass.
- [ ] No runtime logic changes are introduced by this runbook.

## Production Verification

Run the read-only verifier:

```powershell
npm.cmd run verify:production
```

Expected:

- [ ] 17/17 checks pass or return expected auth gating.
- [ ] No send endpoints are called.
- [ ] No webhook POST endpoints are called.
- [ ] No mutation endpoints are called.

## Deployment Steps

1. Confirm the target deployment is `main` or the intended tagged release.
2. Confirm Vercel deployment source is correct.
3. Trigger or verify the Vercel deployment.
4. Wait for Vercel deployment status: Ready.
5. Confirm production URL uses HTTPS.
6. Run production verification.
7. Record deployment URL, commit hash, and time.

Deployment record:

```text
Deployment URL:
Commit:
Operator:
Date/time:
Notes:
```

## Post-Deployment Smoke Test

Open:

- [ ] `/`
- [ ] `/dashboard`
- [ ] `/channels`
- [ ] `/inbox`
- [ ] `/message-logs`
- [ ] `/contacts`
- [ ] `/auto-reply`
- [ ] `/campaigns`
- [ ] `/billing`
- [ ] `/settings`
- [ ] `/license`

Confirm:

- [ ] Pages load without obvious errors.
- [ ] No access tokens are displayed.
- [ ] Campaigns remain draft/audience-preview only.
- [ ] Billing remains manual/report-only.
- [ ] Enforcement flags remain off.

## Authentication / Workspace Checks

- [ ] `/auth/status` loads.
- [ ] `/auth/permissions` loads.
- [ ] `/auth/tenant-access` loads.
- [ ] `/admin/workspaces` loads for admin beta review.
- [ ] Workspace switching is used only for beta/admin testing.
- [ ] Selected workspace cookie is not treated as production tenant security.
- [ ] Paid client access is not enabled without staging enforcement tests.

## Provider / Meta / WhatsApp Checks

- [ ] `/channels` shows WhatsApp and Messenger setup safely.
- [ ] `/message-logs` shows recent logs safely.
- [ ] `/admin/provider-diagnostics` shows provider ID status safely.
- [ ] WhatsApp Access Token is not displayed.
- [ ] Messenger Page Access Token is not displayed.
- [ ] Welzz Stride number `01958474577` is not claimed active unless Meta setup and logs prove it.
- [ ] Real provider sends are tested only when approved.

## Billing Checks

- [ ] `/billing` loads.
- [ ] Manual subscription summary is visible.
- [ ] Payment history is visible if records exist.
- [ ] Receipt pages do not expose secrets or card data.
- [ ] Plan usage is report-only and does not block usage.
- [ ] Gateway automation remains inactive.

## Support Readiness Checks

- [ ] `SUPPORT_HANDOVER_NOTE.md` is reviewed.
- [ ] Support owner knows Channel Center is the first setup check.
- [ ] Support owner knows Message Logs are the provider status source of truth.
- [ ] Support owner knows not to request token screenshots.
- [ ] Support owner knows rollback does not include database reset.
- [ ] Feedback collection path is ready through `BETA_FEEDBACK_FORM.md`.

## Monitoring Checks

- [ ] Vercel deployment logs are accessible.
- [ ] Supabase dashboard/logs are accessible.
- [ ] Dashboard metrics load.
- [ ] Message Logs can be filtered.
- [ ] Billing Summary loads.
- [ ] Any known monitoring gaps are recorded.

Monitoring notes:

```text

```

## Rollback Procedure

Preferred rollback:

1. Revert to the previous Vercel deployment.
2. If needed, create a Git revert commit.
3. Do not reset production database.
4. Keep enforcement flags false:

```env
AUTH_ENFORCED=false
PERMISSIONS_ENFORCED=false
TENANT_MEMBERSHIP_ENFORCED=false
STRICT_PROVIDER_WEBHOOK_ROUTING=false
```

After rollback:

- [ ] Run read-only production verifier.
- [ ] Smoke test critical routes.
- [ ] Notify support owner.
- [ ] Record rollback reason and time.

## Go / No-Go Decision

Choose one:

- [ ] Go: deploy or keep Beta v1.0 active.
- [ ] Go with limitations: deploy or keep active with documented limits.
- [ ] No-go: hold deployment or rollback.

Decision record:

```text
Decision:
Reason:
Operator:
Business owner:
Technical owner:
Support owner:
Date/time:
```
