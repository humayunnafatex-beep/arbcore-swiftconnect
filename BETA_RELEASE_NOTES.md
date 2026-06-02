# ARBCore SwiftConnect Enterprise Beta

## What Is Working

- Dashboard with live CRM/support metrics and quick links.
- Channel Center for WhatsApp and Messenger setup status.
- WhatsApp outbound send, inbound webhook receive, and live auto-reply.
- Messenger inbound webhook, provider-backed test send, and live auto-reply foundation.
- Unified Inbox with conversation grouping, replies, status, assignment, contact linking, internal notes, and follow-up reminders.
- Contacts create, edit, delete, import, search, filters, and duplicate-phone handling.
- Auto Reply rule create, edit, activate, deactivate, delete, and live matching.
- Message Logs for WhatsApp and Messenger filtering and provider status checks.
- Settings persistence for Business Profile, WhatsApp/API, Messenger/Page API, team, and preferences.
- License page for beta plan visibility.
- Supabase Auth and permission readiness routes, not enforced by default.

## Not Yet Fully Active

- Paid billing and subscription automation.
- Full external multi-client onboarding.
- Messenger production app review and final Meta permissions.
- `AUTH_ENFORCED=true` in production.
- `PERMISSIONS_ENFORCED=true` in production.
- Advanced campaign sending with approved templates.

## Testing Checklist

- Open Dashboard and confirm metrics render.
- Open Channel Center and confirm no tokens are displayed.
- Open Inbox and verify conversation list, detail, reply composer, status, assignment, contact card, internal notes, and follow-up reminders.
- Open Message Logs and test channel/status/direction/search filters.
- Open Contacts and confirm duplicate phone messages remain friendly.
- Open Auto Reply and confirm active rule workflow.
- Open Send Messages and confirm missing WhatsApp API does not fake success.
- Open Settings and confirm saved access tokens remain hidden after refresh.
- Open Auth Status and Auth Permissions for readiness metadata only.

## Rollback Notes

- Identify the last known good commit before deployment.
- Prefer Vercel rollback or a Git revert commit.
- Do not reset the production database.
- If a migration has already been applied, plan a forward fix migration instead of destructive rollback.

## Recommended Next Phase

Stabilize beta testing with 2-5 controlled users, then proceed to campaign/template hardening or billing readiness only after production QA feedback is collected.
