# Incident Response Runbook

## Purpose

Use this runbook when ARBCore SwiftConnect has a production issue, beta tester blocker, provider problem, deployment failure, or data safety concern.

Do not expose secrets while collecting evidence. Do not reset production data.

## Incident Template

- Date/time:
- Reporter:
- Workspace/client:
- Affected module:
- Channel:
- Symptoms:
- First safe action:
- Evidence collected:
- Owner:
- Severity:
- Status:
- Resolution:
- Follow-up:

## WhatsApp Messages Not Sending

- Symptoms: Send Messages or Inbox reply returns `provider_error`, `not_configured`, or messages log as `FAILED`.
- Where to check: `/channels`, `/message-logs?channel=WHATSAPP`, Settings WhatsApp/API fields, Vercel logs, Meta app status.
- Safe first action: Confirm Phone Number ID and Access Token presence in Channel Center/Settings without exposing the token.
- What not to do: Do not paste the access token into chat or screenshots. Do not claim success unless logs show `SENT`.
- Escalation: Technical owner checks provider error summary and Meta configuration.

## Messenger Messages Not Sending

- Symptoms: Messenger test send or Inbox reply fails, or PSID sends log `FAILED`.
- Where to check: `/channels`, `/message-logs?channel=MESSENGER`, Messenger/Page API settings, Vercel logs, Meta Page permissions.
- Safe first action: Confirm Page Access Token presence and that the recipient is a valid Facebook Page PSID.
- What not to do: Do not use phone numbers for Messenger PSID tests. Do not expose Page Access Token.
- Escalation: Technical owner checks Meta Page/API status and permissions.

## Webhook Not Receiving

- Symptoms: Customer messages do not appear as `INBOUND / RECEIVED`.
- Where to check: Meta webhook configuration, Channel Center webhook URL, Message Logs, WebhookEvent summaries, Vercel logs.
- Safe first action: Confirm callback URL and verify token match settings.
- What not to do: Do not log raw webhook payloads in public tickets.
- Escalation: Technical owner verifies Meta subscriptions and route health.

## Auto Reply Not Firing

- Symptoms: Inbound message is received, but no outbound auto reply appears.
- Where to check: Auto Reply rules, Auto Reply Analytics, Message Logs, channel configuration, Vercel logs.
- Safe first action: Confirm the rule is active and keyword/match mode matches the inbound text.
- What not to do: Do not manually create a fake `SENT` message.
- Escalation: Technical owner checks duplicate provider message handling, Auto Reply Analytics `ATTEMPTED`/`SENT`/`FAILED` status, and provider send result.

## Wrong Workspace Routing

- Symptoms: Message appears under the wrong workspace or provider event uses beta fallback unexpectedly.
- Where to check: `/admin/provider-diagnostics`, `/auth/tenant-access`, Channel Center, provider IDs in Settings.
- Safe first action: Confirm WhatsApp Phone Number ID or Messenger Page ID is unique and mapped to the correct workspace.
- What not to do: Do not enable `STRICT_PROVIDER_WEBHOOK_ROUTING=true` in production without staging approval.
- Escalation: Technical owner reviews provider routing plan and workspace isolation docs.

## Duplicate Provider ID

- Symptoms: Provider diagnostics shows duplicate WhatsApp Phone Number ID or Messenger Page ID.
- Where to check: `/admin/provider-diagnostics`, Settings for affected workspaces.
- Safe first action: Remove or correct the duplicate non-empty provider ID.
- What not to do: Do not copy live provider credentials into multiple client workspaces.
- Escalation: Technical owner confirms duplicate is resolved before strict routing tests.

## Database Migration Issue

- Symptoms: Build/deploy passes but production route errors occur after schema change, or Prisma migration reports failure.
- Where to check: Vercel logs, Supabase logs, `_prisma_migrations`, `PRODUCTION_MIGRATION_READINESS_CHECKLIST.md`.
- Safe first action: Stop additional migration attempts and collect migration name/status.
- What not to do: Do not run `prisma migrate reset`. Do not delete migration rows manually.
- Escalation: Technical owner decides forward-fix migration or controlled restore.

## Vercel Deployment Failure

- Symptoms: Build fails, deployment is not Ready, or pages return 500/404 unexpectedly.
- Where to check: Vercel deployment logs, latest Git commit, `npm.cmd run build`, `npm.cmd run verify:production`.
- Safe first action: Re-run build locally and inspect deployment logs.
- What not to do: Do not change production secrets while guessing.
- Escalation: Technical owner reverts to previous Ready deployment if needed.

## Auth Login Issue

- Symptoms: `/login`, `/auth/status`, or mapped user checks fail.
- Where to check: Supabase Auth settings, `/auth/status`, `/api/auth/me`, Vercel logs.
- Safe first action: Confirm Supabase public anon env values are configured together and Prisma user mapping exists.
- What not to do: Do not enable `AUTH_ENFORCED=true` in production to test a broken login.
- Escalation: Technical owner checks Supabase user and Prisma `User.supabaseAuthId` mapping.

## Billing Or Payment Record Issue

- Symptoms: Manual payment amount/status looks wrong, receipt is disputed, or plan status is unclear.
- Where to check: `/billing`, receipt page, Dashboard Billing Overview.
- Safe first action: Confirm the manual record against offline payment proof.
- What not to do: Do not mark payment `CONFIRMED` without admin approval. Do not store card data.
- Escalation: Business/admin owner decides correction.

## WhatsApp Media Reply Failure

- Symptoms: Inbox text replies work, but image or PDF replies fail or log `WHATSAPP / OUTBOUND / FAILED`.
- Where to check: `/inbox`, `/message-logs`, Channel Center diagnostics, Meta WhatsApp app status, and Vercel runtime logs.
- Safe first action: Confirm the file is JPEG, PNG, WebP, or PDF and within the Phase 1 size limits. Then check the safe provider error in Message Logs.
- What not to do: Do not collect or paste access tokens, Authorization headers, raw request payloads, or file binary into tickets. Do not claim success unless Message Logs show `SENT`.
- Escalation: Technical owner checks whether the failure happened during Meta media upload or final media message send.

## Messenger Live Page Failure

- Symptoms: Facebook Page messages do not appear in Inbox or Messenger replies/test-send log `FAILED`.
- Where to check: Meta webhook configuration, `/channels`, `/message-logs`, `/inbox`, `MESSENGER_SETUP_GUIDE.md`, and Vercel runtime logs.
- Safe first action: Confirm Page ID, Page Access Token presence, Messenger Verify Token, webhook URL, and `messages` subscription. Confirm the recipient value is a PSID, not a phone number.
- What not to do: Do not collect Page Access Tokens, Authorization headers, raw Meta payloads, or customer private messages beyond the minimum safe summary.
- Escalation: Technical owner checks webhook GET verification, Page ID routing, provider error code, and whether Meta app permissions/app review are required.

## Rollback Procedure

- Revert Vercel to the previous Ready deployment if runtime behavior is broken.
- Keep the production database intact.
- Do not run destructive Prisma commands.
- Restore safe enforcement flags:

```env
AUTH_ENFORCED=false
PERMISSIONS_ENFORCED=false
TENANT_MEMBERSHIP_ENFORCED=false
STRICT_PROVIDER_WEBHOOK_ROUTING=false
```

- Run `npm.cmd run verify:production` after rollback.
- Document the incident and follow-up fix.
