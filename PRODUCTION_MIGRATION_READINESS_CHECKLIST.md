# Production Migration Readiness Checklist

## Purpose

Use this checklist before applying Prisma migrations to the ARBCore SwiftConnect Supabase production database.

This checklist is designed to reduce migration risk. It does not authorize destructive database commands, production resets, or unreviewed SQL.

## Before Migration

- [ ] Confirm the latest Git commit intended for release.
- [ ] Confirm the working tree is clean.
- [ ] Confirm the Vercel deployment for the target commit is `Ready` or the deployment plan is approved.
- [ ] Confirm the correct Supabase project is selected.
- [ ] Confirm `DATABASE_URL` points to the intended production Supabase database.
- [ ] Confirm `DATABASE_URL` is suitable for app/runtime use, usually the pooled Supabase connection.
- [ ] Confirm `DIRECT_URL` points to the same production Supabase database through the direct connection.
- [ ] Confirm `DIRECT_URL` is not the Supabase pooler URL before running migrations.
- [ ] Confirm no one plans to run `prisma migrate reset`.
- [ ] Confirm no destructive SQL will be run.
- [ ] Confirm a backup/export plan exists.
- [ ] Confirm rollback owner and decision owner are available.
- [ ] Confirm production enforcement flags remain safe unless separately approved:

```env
AUTH_ENFORCED=false
PERMISSIONS_ENFORCED=false
TENANT_MEMBERSHIP_ENFORCED=false
STRICT_PROVIDER_WEBHOOK_ROUTING=false
```

## Safe Commands

These checks are safe and expected before migration:

```powershell
git status
npx prisma generate
npm.cmd run build
npm.cmd run verify:production
```

The production verifier is read-only. It checks route health and reports environment readiness without printing secrets or database URLs.

## Migration Application Guidance

- Use the safe Prisma deploy flow for production migrations.
- Prefer `npx prisma migrate deploy` from a trusted release environment with the correct production `DATABASE_URL` and `DIRECT_URL`.
- Do not use `npx prisma migrate dev` against production.
- Do not use `npx prisma migrate reset` against production.
- Do not edit already-applied migration files.
- Do not run destructive SQL unless a separate reviewed rollback plan exists.
- Verify the Prisma migration history table before and after migration:
  - `_prisma_migrations`
- Confirm pending migrations match the expected release.
- Keep logs focused on migration names and status. Do not paste database URLs into tickets or screenshots.

## After Migration

Run:

```powershell
npm.cmd run verify:production
```

Then manually check:

- [ ] Dashboard loads.
- [ ] Settings loads and saves expected beta-safe settings.
- [ ] Channel Center loads.
- [ ] Inbox loads.
- [ ] Message Logs loads.
- [ ] Billing loads.
- [ ] Campaigns loads.
- [ ] `/api/dashboard/statistics` returns safe JSON.
- [ ] `/api/channels/status` returns token presence booleans only.
- [ ] `/api/auth/me` returns safe auth mapping status only.
- [ ] No access tokens, database URLs, cookies, or raw sessions are exposed.

## Rollback

If the app has a deployment issue after migration:

- [ ] Revert Vercel to the previous Ready deployment if needed.
- [ ] Do not reset the production database.
- [ ] Do not delete rows from `_prisma_migrations`.
- [ ] Prefer a forward-fix migration for schema issues already applied to production.
- [ ] Use database backup/restore only with deliberate approval from the decision owner.
- [ ] Restore safe environment flags if any staging value was accidentally copied:

```env
AUTH_ENFORCED=false
PERMISSIONS_ENFORCED=false
TENANT_MEMBERSHIP_ENFORCED=false
STRICT_PROVIDER_WEBHOOK_ROUTING=false
```

- [ ] Run `npm.cmd run verify:production` after rollback or forward fix.

## Sign-Off

- Migration owner:
- Deployment owner:
- Backup/export confirmed by:
- Supabase project confirmed by:
- Latest commit:
- Expected migration folder(s):
- Verification result:
- Production smoke test result:
- Go/no-go decision:
- Notes:
