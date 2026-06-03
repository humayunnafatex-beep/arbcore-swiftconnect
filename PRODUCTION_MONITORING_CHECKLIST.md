# Production Monitoring Checklist

## Daily Checks

- [ ] Run or review `npm.cmd run verify:production`.
- [ ] Confirm `/channels` loads.
- [ ] Confirm `/message-logs` loads.
- [ ] Check failed messages.
- [ ] Check recent webhook events.
- [ ] Check Vercel runtime errors.
- [ ] Check Supabase errors.

## Weekly Checks

- [ ] Check `/admin/provider-diagnostics`.
- [ ] Check `/auth/tenant-access`.
- [ ] Review Channel Center diagnostics for WhatsApp and Messenger.
- [ ] Review Dashboard failed messages and support metrics.
- [ ] Review Billing pending/manual payment records if paid beta clients exist.
- [ ] Review open/pending Inbox conversations and due follow-ups.

## After Deployment Checks

- [ ] Confirm Vercel deployment is `Ready`.
- [ ] Run `npm.cmd run verify:production`.
- [ ] Confirm `17/17` route checks pass or expected auth gating is understood.
- [ ] Confirm environment audit has no blockers.
- [ ] Open `/dashboard`.
- [ ] Open `/channels`.
- [ ] Open `/inbox`.
- [ ] Open `/message-logs`.
- [ ] Open `/exports`.
- [ ] Review Vercel logs for new errors.

## After Meta Settings Change

- [ ] Confirm Settings save succeeded.
- [ ] Confirm access tokens are hidden after refresh.
- [ ] Confirm Channel Center shows expected configured status.
- [ ] Confirm webhook URL is correct.
- [ ] Send or receive a safe test message if approved.
- [ ] Check Message Logs for `SENT`, `FAILED`, or `RECEIVED`.
- [ ] Check provider errors without exposing tokens.

## After Supabase Migration

- [ ] Complete `PRODUCTION_MIGRATION_READINESS_CHECKLIST.md`.
- [ ] Confirm migration status in `_prisma_migrations`.
- [ ] Run `npm.cmd run verify:production`.
- [ ] Check Dashboard, Settings, Channel Center, Inbox, Message Logs, Billing, and Campaigns.
- [ ] Check Supabase logs for database errors.
- [ ] Do not reset the production database.

## Data Export Checks

- [ ] Review `DATA_EXPORT_READINESS_PLAN.md`.
- [ ] Confirm `/exports` loads.
- [ ] Confirm Contacts CSV export is workspace-scoped.
- [ ] Confirm Message Logs CSV export is workspace-scoped and uses safe previews.
- [ ] Confirm Billing CSV export contains manual records only.
- [ ] Confirm exported CSV files are shared only with approved people.

## Before Paid Client Onboarding

- [ ] Complete `PAID_CLIENT_GO_LIVE_GATE.md`.
- [ ] Review `BETA_V1_ACCESS_CONTROL_PLAN.md`.
- [ ] Review `OBSERVABILITY_AND_MONITORING_PLAN.md`.
- [ ] Review `INCIDENT_RESPONSE_RUNBOOK.md`.
- [ ] Confirm provider IDs are unique in `/admin/provider-diagnostics`.
- [ ] Confirm tenant access readiness in `/auth/tenant-access`.
- [ ] Confirm support owner can access Vercel/Supabase logs.
- [ ] Confirm support owner knows rollback and escalation path.
