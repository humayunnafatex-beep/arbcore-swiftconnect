# Observability And Monitoring Plan

## Purpose

This plan defines how ARBCore SwiftConnect should detect and investigate production errors safely during Enterprise Beta and v1.1 hardening.

The goal is to catch failed sends, webhook issues, database issues, environment misconfiguration, and deployment problems without exposing access tokens, database URLs, cookies, raw sessions, or raw webhook payloads.

## Current Observability

Current production readiness signals include:

- Vercel deployment logs.
- Supabase database and API logs.
- `MessageLog` statuses for `SENT`, `FAILED`, `RECEIVED`, and attempted/queued workflows.
- `WebhookEvent` summaries for inbound provider activity.
- Auto Reply Analytics for matched rule attempts, sent replies, failed replies, and safe failure previews.
- Company-scoped CSV exports for approved support review when screenshots are not enough.
- Manual order records for customer order workflow checks.
- `npm.cmd run verify:production` route and environment readiness checks.
- Channel Center diagnostics at `/channels`.
- Provider diagnostics at `/admin/provider-diagnostics`.
- Auth mapping status at `/auth/status`.
- Permission status at `/auth/permissions`.
- Tenant access status at `/auth/tenant-access`.
- Dashboard CRM/support metrics.
- Dashboard metric warnings for optional metric groups that may depend on pending production migrations.

## What To Monitor

- Failed WhatsApp sends.
- Failed Messenger sends.
- Failed auto replies or declining auto-reply success rate.
- Webhook verification failures.
- Webhooks that stop creating inbound `RECEIVED` logs.
- Unmatched provider webhooks.
- Provider ID duplicates.
- Auth mapping problems.
- Tenant access warnings.
- Permission readiness warnings.
- Billing or manual payment status issues.
- Campaign draft and audience preview errors.
- Prisma/database errors.
- Build and deployment failures.
- Environment validation blockers from `npm.cmd run verify:production`.

## Safe Logging Rules

- Never log WhatsApp Access Tokens.
- Never log Messenger Page Access Tokens.
- Never log database URLs.
- Never log cookies.
- Never log raw Supabase sessions.
- Avoid logging raw webhook payloads if they may include customer data.
- Log provider error summaries only.
- Log message previews only when necessary and safe.
- Prefer IDs, statuses, route names, channel names, and timestamps over full payloads.
- Redact authorization headers, bearer tokens, password-like values, and connection strings.

## Recommended Tools

- Vercel Logs for deployment, runtime, and route errors.
- Supabase Logs for database and platform-level errors.
- ARBCore Message Logs for channel send/receive status.
- Auto Reply Analytics for rule-level trigger/send performance.
- Data Exports at `/exports` for approved CSV exports of Contacts, Message Logs, Billing Records, and Auto Reply Analytics.
- Orders at `/orders` for manual order status, payment status, and internal order follow-up review.
- Dashboard Order Operations for due order follow-ups, unpaid/COD orders, and manual order value snapshots.
- Products at `/products` for manual product/model catalog review and Inbox order-entry readiness.
- Dashboard Product Catalog snapshot for active, draft, archived, and stock-note product counts.
- Channel Center for provider setup readiness.
- Provider Diagnostics for duplicate or missing provider IDs.
- Optional Sentry later for grouped application exceptions.
- Optional uptime monitor later for external HTTP checks.

Do not install or enable paid monitoring packages until the integration scope is approved.

## Alert Priorities

### Critical

- Production app is unavailable.
- Database connection is unavailable.
- Webhooks are failing broadly.
- Provider sends fail across all configured channels.
- Secret exposure is suspected.

### High

- One channel cannot send or receive.
- Strict provider routing blocks expected live messages in staging or future production.
- Auth mapping blocks an approved admin in an enforcement test.
- A migration warning is ignored before production migration.

### Medium

- Some messages fail with provider errors.
- WhatsApp media upload or media send fails for an individual Inbox reply.
- Messenger live Page receive/reply fails after Page setup.
- Duplicate provider IDs are detected.
- Billing records are unclear or disputed.
- Campaign audience preview errors affect planning.

### Low

- Documentation confusion.
- Minor UI status mismatch.
- Non-blocking environment readiness warning.
- Optional monitoring variable missing.

## Incident Response Flow

1. Identify the issue, affected route, workspace, channel, user action, and time range.
2. Check Vercel deployment and runtime logs.
3. Check Supabase database/log health.
4. Check Message Logs for `FAILED`, `RECEIVED`, and `SENT` status patterns.
5. Check Auto Reply Analytics when a matched rule did not send or provider failures increase.
6. Check Channel Center diagnostics.
7. Check Provider Diagnostics for duplicate provider IDs or routing issues.
8. Check Auth, Permission, and Tenant status pages if access is involved.
9. Roll back Vercel deployment if production behavior is broken and rollback is safer than forward fix.
10. Keep the production database intact unless a deliberate backup/restore decision is approved.
11. Document the incident, safe evidence, root cause, action taken, and follow-up.

For WhatsApp media replies, Message Logs should show a safe body summary such as `[image]` or `[document]` and a safe provider error on failure. Do not collect file binary, access tokens, Authorization headers, or raw Meta request payloads for monitoring evidence.

For inbound WhatsApp audio playback, evidence should include the Message Logs inbound media badge, safe media type/MIME type, timestamp, and whether `/api/whatsapp/media/[mediaId]` returns a safe error. Never collect or share the access token, Authorization header, raw Meta media URL, raw webhook payload, or downloaded audio file in routine monitoring notes.

For unsupported WhatsApp messages, evidence should include only the safe body preview, provider message type, safe metadata summary, timestamp, and whether the operator expected a normal text message. Meta system/security/verification messages may not expose readable codes through WhatsApp Cloud API. Never collect raw webhook payloads, provider secrets, access tokens, Authorization headers, or screenshots containing tokens.

For WhatsApp profile and ad referral context, evidence should include only safe customer display name, `whatsappProfileName`, source type, source ID, headline, CTWA click ID, and timestamp. Referral context may be absent when Meta does not include it. Never collect profile photos, raw webhook payloads, provider secrets, access tokens, or Authorization headers.

For conversation quality controls, evidence should include conversation channel, contact key or safe display name, read/unread state, starred state, priority, quick label, assignee, and timestamp. These are internal CRM states only and should not be monitored as provider sends or webhook delivery events.

For Saved Replies, evidence should include saved reply title, category, channel, shortcut, whether it was inserted into the composer, and whether the operator clicked Send. Saved Replies do not auto-send and should not be monitored as provider delivery events until a manual send occurs.

For Messenger live setup, monitor Message Logs for `MESSENGER / INBOUND / RECEIVED`, `MESSENGER / OUTBOUND / SENT`, and `FAILED` patterns. Evidence should include Page ID presence, PSID used, safe provider error text, and webhook event time only. Never collect Page Access Tokens or Authorization headers.

For Auto Reply Analytics, evidence should include rule name, channel, status, safe preview, timestamp, and safe error summary only. Never collect full webhook payloads, provider Authorization headers, or access tokens.

CSV exports are operational evidence and may contain customer or business data. Keep them company-scoped, share only with approved reviewers, and never upload exported files to public links.

## Future Monitoring Integrations

Future v1.1 or production expansion may add:

- Sentry server-side exception grouping.
- Uptime monitor for `/`, `/dashboard`, `/channels`, and `/api/health`.
- Alert routing for failed message spikes.
- Dashboard trend for provider failure rate.

Until implemented, these are planning placeholders only.
## Staff Activity Logs

Use `/activity-logs` to review safe summaries of manual operator actions during support investigations. These logs help confirm whether staff changed contact, order, product, saved reply, auto-reply, or inbox state records.

Activity logging is best-effort and should not block customer workflows. Missing activity records should be investigated as an observability issue. Do not use Activity Logs for provider webhook payload inspection; use Message Logs and safe provider diagnostics instead.
