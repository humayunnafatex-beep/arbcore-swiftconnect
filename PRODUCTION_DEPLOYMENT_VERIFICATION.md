# ARBCore SwiftConnect Production Deployment Verification

## Purpose

Use this guide to confirm ARBCore SwiftConnect production is safe after deployment. It is intended for controlled Enterprise Beta releases and should be run after each production push, Vercel deployment, environment variable change, or Meta channel setup change.

This guide must not be used to reset production data, expose secrets, or force auth/permission enforcement before the mapped admin checks are complete.

## Pre-Deployment Checks

- [ ] Git branch is `main`.
- [ ] Working tree is clean.
- [ ] `npx prisma generate` passes.
- [ ] `npm.cmd run build` passes.
- [ ] Migrations are reviewed before deployment.
- [ ] `PRODUCTION_MIGRATION_READINESS_CHECKLIST.md` is completed before applying Prisma migrations.
- [ ] `SUPABASE_DB_CONNECTION_GUIDE.md` is reviewed before changing `DATABASE_URL` or `DIRECT_URL`.
- [ ] No secrets are committed.
- [ ] `.env.example` contains placeholders only.
- [ ] `AUTH_ENFORCED=false` unless a deliberate local/staging test is being run.
- [ ] `PERMISSIONS_ENFORCED=false` unless a deliberate local/staging test is being run.

## Supabase Checks

- [ ] `DATABASE_URL` is configured in Vercel.
- [ ] `DIRECT_URL` is configured in Vercel.
- [ ] `DATABASE_URL` is suitable for runtime, usually the pooled Supabase URL.
- [ ] `DIRECT_URL` is suitable for migrations, usually the direct Supabase URL.
- [ ] Migrations have been applied safely.
- [ ] Production database has not been reset.
- [ ] Backups are enabled.

Check that key tables exist and contain expected beta data:

- `Company`
- `User`
- `Contact`
- `MessageLog`
- `ConversationState`
- `AutoReplyRule`
- `WebhookEvent`

Never run destructive Prisma commands against production. Use reviewed migrations and backup-aware release steps only.

## Vercel Checks

- [ ] Latest deployment is Ready.
- [ ] Production URL loads.
- [ ] HTTPS works.
- [ ] Required environment variables are present in Vercel.
- [ ] Build output does not show TypeScript, Prisma, or route errors.
- [ ] Deployment points to the expected latest commit.

## Required Production URLs To Test

Open each URL in production and confirm the page loads without visible errors:

- `/dashboard`
- `/channels`
- `/inbox`
- `/message-logs`
- `/contacts`
- `/auto-reply`
- `/send-messages`
- `/settings`
- `/license`
- `/login`
- `/auth/status`
- `/auth/permissions`

Production base URL:

```text
https://arbcore-swiftconnect.vercel.app
```

## API Health Checks

These endpoints are safe read/status checks. Do not print access tokens, cookies, raw sessions, or provider secrets.

- `/api/dashboard/statistics`
- `/api/channels/status`
- `/api/channels/diagnostics`
- `/api/inbox/conversations`
- `/api/whatsapp/logs`
- `/api/auth/me`
- `/api/auth/permissions`

Expected behavior:

- APIs respond with JSON or a safe auth/beta status response.
- APIs do not expose WhatsApp access tokens.
- APIs do not expose Messenger Page Access Tokens.
- APIs do not expose raw Supabase sessions or cookies.
- APIs do not expose service role keys.

## Webhook Checks

### WhatsApp

- App route: `/api/whatsapp/webhook`
- Meta callback URL:

```text
https://arbcore-swiftconnect.vercel.app/api/whatsapp/webhook
```

Checklist:

- [ ] Verify Token in Meta exactly matches ARBCore Settings.
- [ ] `messages` is subscribed.
- [ ] Webhook GET verification succeeds with the correct token.
- [ ] Webhook GET verification fails with the wrong token.
- [ ] Inbound test message logs as `INBOUND / RECEIVED`.

### Messenger

- App route: `/api/messenger/webhook`
- Meta callback URL:

```text
https://arbcore-swiftconnect.vercel.app/api/messenger/webhook
```

Checklist:

- [ ] Verify Token in Meta exactly matches ARBCore Settings.
- [ ] `messages` is subscribed.
- [ ] Webhook GET verification succeeds with the correct token.
- [ ] Webhook GET verification fails with the wrong token.
- [ ] Inbound Page test message logs as `MESSENGER / INBOUND / RECEIVED`.

## Channel Center Checks

- [ ] WhatsApp configured status is correct.
- [ ] Messenger configured status is correct.
- [ ] Webhook URL copy helpers show only safe URLs.
- [ ] Diagnostics show outbound readiness.
- [ ] Diagnostics show webhook readiness.
- [ ] Missing setup items are field names only, not secret values.
- [ ] Tokens are never displayed.

## Inbox And CRM Checks

- [ ] Conversations load.
- [ ] Reply composer is visible for a selected conversation.
- [ ] Status update works for `OPEN`, `PENDING`, and `CLOSED`.
- [ ] Assignment works.
- [ ] Contact linking works.
- [ ] Internal note saves and reloads.
- [ ] Follow-up reminder saves and reloads.
- [ ] Internal notes are not sent to customers.
- [ ] Failed replies keep draft text for retry.

## Message Logs Checks

- [ ] Channel filter works.
- [ ] Direction filter works.
- [ ] Status filter works.
- [ ] Search works.
- [ ] WhatsApp logs show when data exists.
- [ ] Messenger logs show when data exists.
- [ ] `SENT`, `FAILED`, and `RECEIVED` are visible when relevant.
- [ ] Provider IDs and safe error text display without secrets.
- [ ] Raw webhook payloads are not exposed in the UI.

## Security Checks

- [ ] WhatsApp Access Token is not shown.
- [ ] Messenger Page Access Token is not shown.
- [ ] No secrets are committed in docs.
- [ ] No raw Supabase session or cookie is shown.
- [ ] `.env.example` uses placeholders only.
- [ ] `AUTH_ENFORCED=false` unless deliberately testing.
- [ ] `PERMISSIONS_ENFORCED=false` unless deliberately testing.
- [ ] Message success is never claimed unless provider-backed logs show `SENT`.

## Optional Read-Only Script

Run the read-only verification script from a trusted terminal:

```powershell
$env:PRODUCTION_URL="https://arbcore-swiftconnect.vercel.app"
npm.cmd run verify:production
```

The script performs GET checks only. It does not call send endpoints, webhook POST endpoints, or mutation endpoints.
It also classifies database URLs safely as present/missing, likely pooled, likely direct, local SQLite, or unknown without printing real URLs.

## Rollback Checklist

- [ ] Revert Vercel to the previous Ready deployment if production is broken.
- [ ] Set `AUTH_ENFORCED=false`.
- [ ] Set `PERMISSIONS_ENFORCED=false`.
- [ ] Do not reset the production database.
- [ ] Check latest working commit.
- [ ] Re-test `/dashboard`, `/channels`, `/inbox`, `/message-logs`, `/settings`, and `/api/health`.
- [ ] Record the issue, affected route, deployment time, and rollback action.
