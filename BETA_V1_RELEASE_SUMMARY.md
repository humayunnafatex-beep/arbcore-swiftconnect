# ARBCore SwiftConnect Enterprise Beta v1.0

## Release Purpose

ARBCore SwiftConnect Enterprise Beta v1.0 packages the current stable product for:

- Welzz Stride's own business use.
- Internal beta operation and feedback collection.
- Future paid SaaS client onboarding after staging enforcement tests pass.

This release is production-beta ready, but it intentionally keeps full SaaS enforcement and bulk automation disabled by default.

## Completed Modules

- Dashboard CRM/support metrics and quick links.
- Channel Center for WhatsApp and Messenger setup status.
- WhatsApp Cloud API send, receive, logs, and live auto-reply.
- Messenger send, receive, logs, and live auto-reply foundation.
- Unified Inbox CRM with conversation grouping, replies, status, assignment, contact linking, internal notes, and follow-up reminders.
- Contacts create, edit, delete, import, search, filters, and duplicate handling.
- Auto Reply rules create, edit, activate, deactivate, delete, and live matching.
- Message Logs for WhatsApp and Messenger with filters.
- Campaign drafts and Contact-based audience preview without sending.
- Manual Billing, payment records, receipts, billing metrics, and report-only plan usage.
- License status.
- Supabase Auth readiness.
- Permission readiness.
- Workspace onboarding and beta/admin workspace switching.
- Provider webhook routing and strict routing readiness.
- Tenant membership readiness.
- QA, security, migration, deployment, and production verification docs.
- Client onboarding, support handover, beta feedback, staging enforcement, and paid-client go-live docs.

## Current Safe Defaults

```env
AUTH_ENFORCED=false
PERMISSIONS_ENFORCED=false
TENANT_MEMBERSHIP_ENFORCED=false
STRICT_PROVIDER_WEBHOOK_ROUTING=false
```

Also intentionally safe:

- Campaign sending is disabled.
- Plan limits are report-only.
- Billing gateway automation is inactive.
- Manual billing does not store card data.
- Provider tokens are hidden after save.

## What Is Active

- Manual Dashboard, Contacts, Inbox, Auto Reply, Message Logs, Campaign Drafts, Billing, License, and Settings workflows.
- WhatsApp provider sending only when WhatsApp Cloud API is configured.
- Messenger provider sending only when Messenger Page API is configured.
- Auto Reply on configured channels when active rules match inbound messages.
- Inbox reply workflow for WhatsApp and Messenger conversations.
- Manual subscription/payment tracking and printable manual receipts.

## What Is Intentionally Not Active

- Full production auth enforcement.
- Full permission enforcement.
- Tenant membership enforcement.
- Strict provider routing in production.
- Automated payment gateway.
- Bulk campaign sending.
- Plan limit enforcement.

## Production Verification Status

- `npm.cmd run build` passes.
- `npm.cmd run verify:production` passes 17/17 read-only checks.
- No token exposure is expected from status, logs, diagnostics, or settings pages.
- Read-only verifier does not call send, webhook POST, or mutation endpoints.

## Known Limitations

- Welzz Stride real number `01958474577` still needs Meta Cloud API connection if not already completed.
- Paid client onboarding requires `TENANT_ENFORCEMENT_STAGING_CHECKLIST.md`.
- Paid client approval requires `PAID_CLIENT_GO_LIVE_GATE.md`.
- Provider IDs must remain unique across workspaces.
- Messenger production use may require Meta app review or permissions.
- Campaign sending requires compliance, approved templates, queueing, rate limits, and policy controls in a later phase.

## Recommended Next Manual Steps For Welzz Stride

1. Apply any pending production migrations safely.
2. Confirm Vercel deployment is Ready.
3. Open `/channels` and confirm channel setup status.
4. Test WhatsApp inbound/outbound flow if configured.
5. Use `/inbox` for customer conversation handling.
6. Test Auto Reply with a controlled keyword.
7. Test Campaign audience preview without sending.
8. Collect feedback with `BETA_FEEDBACK_FORM.md`.

## Recommended Next Steps Before Paid Client Onboarding

1. Run `TENANT_ENFORCEMENT_STAGING_CHECKLIST.md`.
2. Complete `PAID_CLIENT_GO_LIVE_GATE.md`.
3. Review `ENFORCEMENT_FLAGS_REFERENCE.md`.
4. Verify `/admin/provider-diagnostics` has no duplicate provider IDs.
5. Verify `/auth/tenant-access` shows expected user-company membership.
6. Verify `/auth/status` shows a mapped admin user.
7. Confirm manual billing plan/payment record process.
8. Confirm `SUPPORT_HANDOVER_NOTE.md` is ready for support.

## Rollback

- Use the previous Vercel deployment or a Git revert commit.
- Do not reset the production database.
- Keep all enforcement flags false unless staging has passed and a controlled production rollout is approved.

```env
AUTH_ENFORCED=false
PERMISSIONS_ENFORCED=false
TENANT_MEMBERSHIP_ENFORCED=false
STRICT_PROVIDER_WEBHOOK_ROUTING=false
```
