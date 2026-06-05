# ARBCore SwiftConnect Enterprise Beta

For the final Beta v1.0 package, review `BETA_V1_RELEASE_SUMMARY.md`, `EXECUTIVE_HANDOVER_SUMMARY.md`, and `TECHNICAL_HANDOVER_INDEX.md`.

For Beta outcome evaluation, use `BETA_V1_SUCCESS_CRITERIA_AND_EXIT_PLAN.md`.

## What Is Working

- Dashboard with live CRM/support metrics and quick links.
- Channel Center for WhatsApp and Messenger setup status.
- WhatsApp outbound send, inbound webhook receive, and live auto-reply.
- Inbound WhatsApp audio playback in Inbox through a secure ARBCore media proxy.
- Messenger inbound webhook, provider-backed test send, and live auto-reply foundation.
- Unified Inbox with conversation grouping, replies, status, assignment, contact linking, internal notes, and follow-up reminders.
- Campaign draft planning and Contact-based audience preview for WhatsApp and Messenger, without bulk sending.
- Contacts create, edit, delete, import, search, status/tag filters, and duplicate-phone handling.
- Customer lead statuses and tags for sales tracking from Contacts and the Inbox contact card.
- Manual Order Tracking from Inbox conversations with order/payment status updates.
- Manual order message templates for reviewed confirmation and status-update text from order data.
- Order follow-up alerts, filters, and quick order/payment status updates for staff operations.
- Product Catalog Phase 1 for manual product/model setup and Inbox order form dropdown.
- Auto Reply rule create, edit, activate, deactivate, delete, and live matching.
- Auto Reply Analytics for rule attempts, sent replies, failed replies, success rate, and safe recent event previews.
- Message Logs for WhatsApp and Messenger filtering and provider status checks.
- Settings persistence for Business Profile, WhatsApp/API, Messenger/Page API, team, and preferences.
- License page for beta plan visibility.
- Billing page for manual subscription tracking, billing summary metrics, report-only plan usage, payment history, and printable manual receipts.
- Data Exports page for company-scoped Contacts, Message Logs, Billing Records, and Auto Reply Analytics CSV files.
- Orders CSV export for manual order records.
- Products CSV export for manual product/model records.
- Supabase Auth and permission readiness routes, not enforced by default.
- Tenant membership readiness and paid-client go-live checklists, not enforced by default.

## Not Yet Fully Active

- Automated paid billing and subscription enforcement.
- Full external multi-client onboarding.
- Messenger production app review and final Meta permissions.
- `AUTH_ENFORCED=true` in production.
- `PERMISSIONS_ENFORCED=true` in production.
- `TENANT_MEMBERSHIP_ENFORCED=true` in production.
- `STRICT_PROVIDER_WEBHOOK_ROUTING=true` in production.
- Advanced campaign sending with approved templates.
- Bulk campaign sending, broadcast automation, and campaign delivery metrics.

## Testing Checklist

- Open Dashboard and confirm metrics render.
- Open Channel Center and confirm no tokens are displayed.
- Open Inbox and verify conversation list, detail, reply composer, status, assignment, contact card, internal notes, and follow-up reminders.
- Open Message Logs and test channel/status/direction/search filters.
- Open Contacts and confirm duplicate phone messages remain friendly.
- Create or edit a contact with status and tags, then filter by status/tag.
- From Inbox, update a linked contact status/tags and confirm the contact card refreshes.
- From Inbox, create an order and confirm it appears on `/orders`.
- Create an active product, select it from Inbox order form, and confirm model/price/size helpers fill without inventory deduction.
- On `/orders`, filter by order status, payment status, follow-up status, search, and sort.
- Save a quick order/payment/follow-up update and confirm no customer message is sent automatically.
- From Inbox, prepare an order message and confirm it fills the reply composer without sending automatically.
- From Orders, preview or copy an order message and confirm staff review is still required.
- Open Auto Reply and confirm active rule workflow.
- Open Auto Reply Analytics and confirm rule performance loads without exposing tokens or raw webhook payloads.
- Open Data Exports and confirm CSV options are available without exposing tokens or raw webhook payloads.
- Open Campaigns and confirm draft create/edit/archive works without any send button.
- Preview Campaign audience and confirm the list is Contacts-only and sends nothing.
- Open Send Messages and confirm missing WhatsApp API does not fake success.
- Open Settings and confirm saved access tokens remain hidden after refresh.
- From Inbox, confirm WhatsApp text replies still send and that Phase 1 image/PDF replies upload to Meta first, then log `SENT` only after Meta accepts the final message.
- From Inbox, confirm inbound WhatsApp audio shows an audio player and no token or raw Meta media URL is exposed.
- Confirm unsupported media types and oversized files are rejected safely before provider calls.
- Configure Messenger live setup with Facebook Page ID, Page Access Token, callback URL, verify token, and `messages` subscription before live Page testing.
- Confirm Messenger Page messages appear in Message Logs and Inbox, and that Inbox replies log `MESSENGER / OUTBOUND / SENT` only after Meta accepts.
- Use `MOBILE_RESPONSIVENESS_QA_CHECKLIST.md` to verify daily operator pages on mobile browser.
- Recommend `/inbox`, `/message-logs`, `/contacts`, and `/send-messages` for mobile daily use. Keep Meta setup, token entry, Admin Workspaces, Provider Diagnostics, and Billing setup desktop-preferred.
- Auto Reply now includes a text-only Template Library. Users can select a template, review the pre-filled rule, then save it as active.
- Recommended first template rules are `price`, `size`, `order`, `delivery`, `cod`, and `support`.
- Failed auto replies should be reviewed from Auto Reply Analytics and cross-checked in Message Logs.
- Unsupported WhatsApp system/security/verification/interactive message types are logged with safe diagnostics such as `[unsupported: system]`, provider message type, and short metadata summary only.
- Meta verification codes may not be readable through WhatsApp Cloud API. Request codes by SMS, phone call, email, or authenticator when available.
- WhatsApp profile names are captured when Meta includes them, while customer profile photos are not provided by WhatsApp Cloud API. ARBCore uses initials/avatar fallback and supports manual contact name override.
- Click-to-WhatsApp referral context is captured when Meta includes safe fields, but referral data may not appear for every message or ad click.
- Inbox conversations now support internal read/unread state, starred conversations, priority levels, and quick labels for daily triage.
- Dashboard shows a conversation quality snapshot. These CRM states do not send customer messages or change provider behavior.
- Saved Replies / Quick Replies allow operators to manage reusable text replies and insert them into the Inbox composer. Staff must review and click Send manually.
- Saved Replies Phase 1 is text-only; no media saved replies, AI generation, or auto-send behavior is active.
- Open Billing and confirm manual subscription/payment tracking works without gateway automation.
- Confirm Billing Summary separates `CONFIRMED` and `PENDING` payment totals.
- Confirm Plan Usage shows limits without blocking over-limit usage.
- Open a manual receipt from Payment History and confirm it does not show secrets or card data.
- Open Auth Status and Auth Permissions for readiness metadata only.
- Open Tenant Access Status for report-only tenant membership readiness.
- Use `CLIENT_ONBOARDING_GUIDE.md` before onboarding each beta business.
- Run `WELZZ_STRIDE_INTERNAL_BETA_RUNBOOK.md` before paid client onboarding.
- Collect structured tester feedback with `BETA_FEEDBACK_FORM.md`.
- Use `SUPPORT_HANDOVER_NOTE.md` for support URLs, common issue checks, and escalation.
- Complete `PRODUCTION_DEPLOYMENT_VERIFICATION.md` and `PRODUCTION_MANUAL_QA_CHECKLIST.md` after each production deployment.
- Use `SUPABASE_PRODUCTION_MIGRATION_CHECKLIST.md` to verify production migration readiness.
- Use `TENANT_ENFORCEMENT_STAGING_CHECKLIST.md`, `PAID_CLIENT_GO_LIVE_GATE.md`, and `ENFORCEMENT_FLAGS_REFERENCE.md` before enforcement tests or paid client onboarding.
- Optionally run `npm.cmd run verify:production` for read-only route/API checks.

## Client Onboarding And Support Docs

- `BETA_V1_RELEASE_SUMMARY.md`: Enterprise Beta v1.0 scope, safe defaults, verification status, known limitations, and next steps.
- `EXECUTIVE_HANDOVER_SUMMARY.md`: business-friendly handover summary for decision makers.
- `TECHNICAL_HANDOVER_INDEX.md`: grouped technical document index for developers, support, QA, and operations.
- `BETA_V1_SUCCESS_CRITERIA_AND_EXIT_PLAN.md`: Beta success criteria, blocker conditions, expansion readiness, and exit decision guide.
- `CLIENT_ONBOARDING_GUIDE.md`: step-by-step onboarding for Welzz Stride internal testing and future beta clients.
- `BETA_FEEDBACK_FORM.md`: practical beta feedback template for feature ratings, setup experience, bugs, and paid-pilot readiness.
- `WELZZ_STRIDE_INTERNAL_BETA_RUNBOOK.md`: internal beta workflow and go/no-go decision guide.
- `SUPPORT_HANDOVER_NOTE.md`: support reference for key URLs, common tasks, common issues, safety rules, and escalation checks.
- `PRODUCTION_DEPLOYMENT_VERIFICATION.md`: post-deployment guide for Vercel, Supabase, routes, APIs, webhooks, security, and rollback.
- `PRODUCTION_MANUAL_QA_CHECKLIST.md`: checkbox-based manual QA checklist for production beta verification.
- `SUPABASE_PRODUCTION_MIGRATION_CHECKLIST.md`: production migration verification checklist for Supabase.
- `TENANT_ENFORCEMENT_STAGING_CHECKLIST.md`: staging checklist for auth, permission, tenant, and strict provider enforcement.
- `PAID_CLIENT_GO_LIVE_GATE.md`: paid external client approval gate.
- `ENFORCEMENT_FLAGS_REFERENCE.md`: enforcement flag behavior and rollback values.

## Rollback Notes

- Identify the last known good commit before deployment.
- Prefer Vercel rollback or a Git revert commit.
- Do not reset the production database.
- If a migration has already been applied, plan a forward fix migration instead of destructive rollback.

## Recommended Next Phase

Stabilize beta testing with 2-5 controlled users, then proceed to campaign/template hardening or billing readiness only after production QA feedback is collected.
## Staff Activity Logs

- Added internal-only Activity Logs for manual staff actions across contacts, inbox state, orders, products, saved replies, and auto-reply rules.
- Activity Logs store safe summaries only and do not expose tokens, raw webhook payloads, cookies, sessions, Authorization headers, or provider secrets.
- Activity Logs CSV export is available from Data Exports for approved internal review.

## Team Member Management

- Improved Settings Team Members management with clear create, Save Role, Deactivate, and Reactivate actions.
- Added last active owner protection to prevent accidental owner lockout.
- Team member create, role update, deactivate, and reactivate actions are recorded in Activity Logs.

## Role-Based Staff Guidance

- Added role-oriented UI guidance in the sidebar, account menu, and Team Members settings.
- Owner/Admin, Manager, and Agent responsibilities are explained without enabling hard enforcement.
- Enforcement flags remain off by default for beta stability.

## Product Image Workflow

- Products now show clearer public HTTPS image URL guidance and preview.
- Inbox selected product helper now shows product image preview when available.
- Staff can manually send a selected product image in WhatsApp conversations. Images are never auto-sent.
- No upload/storage infrastructure was added; product images remain URL-based.
