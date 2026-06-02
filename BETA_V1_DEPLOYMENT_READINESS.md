# Beta v1.0 Deployment Readiness Checklist

## Purpose

Use this checklist after the `v1.0.0-beta` tag has been created and before deploying, expanding internal beta access, or preparing external beta access.

Review these companion docs first:

- `BETA_V1_RELEASE_SUMMARY.md`
- `BETA_V1_STAKEHOLDER_REVIEW_CHECKLIST.md`
- `TECHNICAL_HANDOVER_INDEX.md`
- `LAUNCH_CHECKLIST.md`
- `SUPPORT_HANDOVER_NOTE.md`

This is a documentation-only deployment gate. It does not enable production flags or change runtime behavior.

## Release Tag Confirmation

- [ ] `v1.0.0-beta` tag exists locally.
- [ ] `v1.0.0-beta` tag is pushed to origin.
- [ ] Tag message is `Enterprise Beta v1.0 release`.
- [ ] Latest release commit is documented.
- [ ] No uncommitted local changes exist before deployment.
- [ ] `main` is aligned with `origin/main`.

Notes:

```text

```

## Environment Readiness

- [ ] Production Vercel project is selected.
- [ ] Required environment variables are present in Vercel.
- [ ] No real secrets are committed to Git.
- [ ] `AUTH_ENFORCED=false`.
- [ ] `PERMISSIONS_ENFORCED=false`.
- [ ] `TENANT_MEMBERSHIP_ENFORCED=false`.
- [ ] `STRICT_PROVIDER_WEBHOOK_ROUTING=false`.
- [ ] `NEXT_PUBLIC_APP_URL` matches the production domain.
- [ ] Meta/OpenAI/provider secrets are stored only in platform secrets where needed.

Notes:

```text

```

## Database Readiness

- [ ] Supabase production database is reachable.
- [ ] `DATABASE_URL` uses the production-safe app connection.
- [ ] `DIRECT_URL` uses the production-safe direct migration connection.
- [ ] Prisma migrations are reviewed.
- [ ] `SUPABASE_PRODUCTION_MIGRATION_CHECKLIST.md` is reviewed.
- [ ] No destructive Prisma command is planned.
- [ ] Production database backup/export plan is understood.

Notes:

```text

```

## Authentication And Access Readiness

- [ ] `/auth/status` loads.
- [ ] `/auth/permissions` loads.
- [ ] `/auth/tenant-access` loads.
- [ ] Auth readiness is understood as report-only unless staging enforcement tests pass.
- [ ] Permission readiness is understood as report-only unless staging enforcement tests pass.
- [ ] Tenant membership readiness is understood as report-only unless staging enforcement tests pass.
- [ ] Public webhook routes remain public for Meta callbacks.

Notes:

```text

```

## Workspace / Tenant Readiness

- [ ] `/admin/workspaces` loads for admin beta review.
- [ ] Workspace switching is treated as beta/admin testing only.
- [ ] Selected workspace cookie is not treated as tenant security.
- [ ] Provider IDs are unique across workspaces or duplicates are documented and resolved before strict routing.
- [ ] `TENANT_ENFORCEMENT_STAGING_CHECKLIST.md` is required before paid client enforcement.
- [ ] `PAID_CLIENT_GO_LIVE_GATE.md` is required before paid external client onboarding.

Notes:

```text

```

## Provider / Meta / WhatsApp Readiness

- [ ] Channel Center loads.
- [ ] WhatsApp settings are configured only if real WhatsApp tests are planned.
- [ ] Messenger settings are configured only if real Messenger tests are planned.
- [ ] Access tokens are hidden after refresh.
- [ ] Webhook URLs are correct.
- [ ] `messages` subscription is confirmed in Meta when testing live channels.
- [ ] Welzz Stride number `01958474577` is not claimed active unless Meta verification and logs prove it.
- [ ] `/admin/provider-diagnostics` shows no duplicate provider IDs before strict routing tests.

Notes:

```text

```

## Billing Readiness

- [ ] Billing page loads.
- [ ] Manual subscription status is understood.
- [ ] Manual payment status meanings are understood.
- [ ] Receipt workflow is understood.
- [ ] Gateway automation is inactive.
- [ ] Plan limits are report-only and do not block usage.

Notes:

```text

```

## Support Readiness

- [ ] `SUPPORT_HANDOVER_NOTE.md` is reviewed.
- [ ] Support knows Channel Center is the first channel setup check.
- [ ] Support knows Message Logs are the provider status source of truth.
- [ ] Support knows not to expose or request screenshots of access tokens.
- [ ] Support knows rollback does not include database reset.
- [ ] Support escalation owner is identified.

Notes:

```text

```

## Monitoring And Analytics Readiness

- [ ] Dashboard loads.
- [ ] Message Logs load.
- [ ] Billing Summary loads.
- [ ] Production verifier passes expected read-only checks.
- [ ] Vercel deployment logs are accessible to the technical owner.
- [ ] Supabase logs/metrics are accessible to the technical owner.
- [ ] Known gaps are documented before expanding beta access.

Notes:

```text

```

## Backup And Rollback Readiness

- [ ] Previous Vercel deployment can be restored.
- [ ] Git revert path is understood.
- [ ] Database reset is not part of rollback.
- [ ] Production database backup/export process is known.
- [ ] Enforcement flags rollback values are known:

```env
AUTH_ENFORCED=false
PERMISSIONS_ENFORCED=false
TENANT_MEMBERSHIP_ENFORCED=false
STRICT_PROVIDER_WEBHOOK_ROUTING=false
```

Notes:

```text

```

## Client Beta Access Readiness

- [ ] Beta limitations are explained.
- [ ] `BETA_FEEDBACK_FORM.md` is ready.
- [ ] `CLIENT_ONBOARDING_GUIDE.md` is reviewed.
- [ ] `BETA_V1_STAKEHOLDER_REVIEW_CHECKLIST.md` is completed.
- [ ] Paid external access is blocked until `PAID_CLIENT_GO_LIVE_GATE.md` passes.
- [ ] No client receives reused Welzz Stride provider credentials.
- [ ] Client workspace, auth mapping, tenant access, and provider diagnostics are verified before any paid pilot.

Notes:

```text

```

## Final Deployment Decision

Choose one:

- [ ] Ready to deploy Beta v1.0.
- [ ] Ready to expand internal beta access.
- [ ] Ready for client demo only.
- [ ] Hold deployment; fixes or review required.

Decision summary:

```text

```

Sign-off:

```text
Business owner:
Technical owner:
Support owner:
Date:
Decision:
```
