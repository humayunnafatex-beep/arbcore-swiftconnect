# ARBCore SwiftConnect Support Handover Note

## Product Summary

ARBCore SwiftConnect is an Enterprise Beta workspace for managing contacts, WhatsApp and Messenger communication workflows, auto replies, unified inbox conversations, message logs, and dashboard CRM/support metrics.

The product uses provider-backed sending for Meta channels. It does not fake WhatsApp or Messenger provider success.

## Current Production Status

- WhatsApp outbound send works when Meta settings are configured.
- WhatsApp inbound webhook receive works.
- WhatsApp live auto-reply works.
- Messenger inbound webhook foundation works.
- Messenger provider-backed test send and live auto-reply foundation exist.
- Channel Center shows safe setup status without tokens.
- Unified Inbox supports replies, status, assignment, contact linking, internal notes, and follow-up reminders.
- Campaigns support draft planning only; bulk sending is not active.
- Campaign audience preview uses Contacts for planning only and does not send messages.
- Message Logs show WhatsApp and Messenger status safely.
- Auth and permission readiness exists, but enforcement is off by default.
- Manual subscription and payment tracking exists for paid beta clients, but gateway automation and billing enforcement are not active.

## Key URLs

- Production URL: `https://arbcore-swiftconnect.vercel.app`
- Settings: `https://arbcore-swiftconnect.vercel.app/settings`
- Channel Center: `https://arbcore-swiftconnect.vercel.app/channels`
- Inbox: `https://arbcore-swiftconnect.vercel.app/inbox`
- Message Logs: `https://arbcore-swiftconnect.vercel.app/message-logs`
- Dashboard: `https://arbcore-swiftconnect.vercel.app/dashboard`
- Billing: `https://arbcore-swiftconnect.vercel.app/billing`
- Auth Status: `https://arbcore-swiftconnect.vercel.app/auth/status`
- Permission Status: `https://arbcore-swiftconnect.vercel.app/auth/permissions`
- Tenant Access Status: `https://arbcore-swiftconnect.vercel.app/auth/tenant-access`

## Critical Docs

- `BETA_V1_RELEASE_SUMMARY.md`
- `BETA_V1_FEEDBACK_TRIAGE_WORKFLOW.md`
- `EXECUTIVE_HANDOVER_SUMMARY.md`
- `TECHNICAL_HANDOVER_INDEX.md`
- `OPERATING_MANUAL.md`
- `LAUNCH_CHECKLIST.md`
- `BETA_RELEASE_NOTES.md`
- `PRODUCTION_QA_REPORT.md`
- `SECURITY_QA_REPORT.md`
- `MIGRATION_AUDIT.md`
- `META_WHATSAPP_SETUP_GUIDE.md`
- `MESSENGER_SETUP_GUIDE.md`
- `WELZZ_STRIDE_NUMBER_CONNECTION_CHECKLIST.md`
- `CLIENT_ONBOARDING_GUIDE.md`
- `BETA_FEEDBACK_FORM.md`
- `WELZZ_STRIDE_INTERNAL_BETA_RUNBOOK.md`
- `PRODUCTION_DEPLOYMENT_VERIFICATION.md`
- `PRODUCTION_MANUAL_QA_CHECKLIST.md`
- `SUPABASE_PRODUCTION_MIGRATION_CHECKLIST.md`
- `CLIENT_WORKSPACE_ONBOARDING_PLAN.md`
- `WORKSPACE_ISOLATION_QA_REPORT.md`
- `WORKSPACE_SWITCHING_TEST_CHECKLIST.md`
- `PROVIDER_WEBHOOK_ROUTING_PLAN.md`
- `STRICT_PROVIDER_WEBHOOK_ROUTING.md`
- `PROVIDER_ID_UNIQUENESS_PLAN.md`
- `OBSERVABILITY_AND_MONITORING_PLAN.md`
- `INCIDENT_RESPONSE_RUNBOOK.md`
- `PRODUCTION_MONITORING_CHECKLIST.md`
- `DATA_EXPORT_READINESS_PLAN.md`

## Common Support Tasks

- Check Channel Center for WhatsApp and Messenger setup readiness.
- Use `BETA_V1_FEEDBACK_TRIAGE_WORKFLOW.md` as the Beta issue triage workflow for feedback, bugs, access, provider, billing, and security concerns.
- Run or review `PRODUCTION_DEPLOYMENT_VERIFICATION.md` after a deployment.
- Use `PRODUCTION_MANUAL_QA_CHECKLIST.md` for manual route and workflow verification.
- Use `WELZZ_STRIDE_INTERNAL_BETA_RUNBOOK.md` for internal 2-3 day beta operations before paid client onboarding.
- Use `SUPABASE_PRODUCTION_MIGRATION_CHECKLIST.md` when verifying production migrations.
- Use `CLIENT_WORKSPACE_ONBOARDING_PLAN.md` and `/admin/workspaces` before creating a separate client workspace.
- Use `TENANT_MEMBERSHIP_ENFORCEMENT_PLAN.md` and `/auth/tenant-access` before enabling paid client access.
- Use `TENANT_ENFORCEMENT_STAGING_CHECKLIST.md`, `PAID_CLIENT_GO_LIVE_GATE.md`, and `ENFORCEMENT_FLAGS_REFERENCE.md` before changing enforcement flags or approving paid external client access.
- Use the Select Workspace and Clear Selected Workspace actions only for admin beta testing.
- Use `WORKSPACE_ISOLATION_QA_REPORT.md` and `WORKSPACE_SWITCHING_TEST_CHECKLIST.md` before claiming workspace separation is ready for beta client testing.
- Use `PROVIDER_WEBHOOK_ROUTING_PLAN.md` when testing inbound WhatsApp/Messenger routing across more than one workspace.
- Use `STRICT_PROVIDER_WEBHOOK_ROUTING.md` before enabling strict unmatched-provider behavior in local, staging, or production.
- Use `/admin/provider-diagnostics` and `PROVIDER_ID_UNIQUENESS_PLAN.md` to check duplicate provider IDs before strict routing.
- Use `OBSERVABILITY_AND_MONITORING_PLAN.md` to understand current production signals and safe logging rules.
- Use `INCIDENT_RESPONSE_RUNBOOK.md` during provider, webhook, database, deployment, auth, or billing incidents.
- Use `PRODUCTION_MONITORING_CHECKLIST.md` for daily, weekly, post-deployment, post-Meta-change, and post-migration checks.
- Use `DATA_EXPORT_READINESS_PLAN.md` before sharing Contacts, Message Logs, Billing, or Auto Reply Analytics CSV exports.
- Use `/exports` to download approved workspace-scoped CSV exports.
- Check Message Logs for `SENT`, `FAILED`, `RECEIVED`, or `ATTEMPTED`.
- Check Billing for manual subscription status and payment records when supporting paid beta clients.
- If Dashboard shows metric warnings, review production migrations before treating it as a user workflow bug.
- Check Admin Workspaces for workspace summary counts when preparing an external beta client.
- Use Billing Summary to review confirmed totals, pending totals, last payment, and period status.
- Use Plan Usage to review report-only limits for contacts, team members, auto replies, monthly messages, inbox conversations, and channels.
- Use View Receipt from Payment History for printable manual receipts.
- Check Campaigns for draft name, channel, status, audience note, message body, schedule date, and internal notes.
- Check Campaign audience criteria and preview list when a client asks who a draft may target.
- Investigate a failed message by reviewing status, provider ID, safe error text, and channel settings.
- Confirm Auto Reply rule status, keyword, match mode, and channel configuration.
- Verify webhook callback URL and verify token match Meta settings.
- Confirm saved access tokens remain hidden after refresh.
- Use Inbox assignment and follow-up reminders to confirm who owns a conversation.
- Use Contacts or the Inbox contact card to update lead status and tags during customer follow-up.
- Use Inbox or Orders to create and update manual order records for customer conversations.
- Use Products to maintain manual product/model records for order entry.
- Use order message templates to prepare customer-facing order confirmation or status text, then review and send manually from Inbox or copy from Orders.
- Use Orders follow-up filters to find due, upcoming, done, or missing follow-ups.
- Quick order status, payment status, and follow-up changes are internal record updates only and do not send customer messages automatically.
- Order Tracking Phase 1 does not include payment gateway, courier integration, inventory automation, or automatic customer messages.
- Product Catalog Phase 1 does not include ecommerce checkout, upload storage, stock reservation, or inventory deduction.
- Recommended tags: `size-40`, `size-41`, `size-42`, `solm8`, `facebook`, `whatsapp`, `priority`, `cod`, `repeat-customer`.

## Common Issues And Fixes

### WhatsApp Not Sending

- Confirm Phone Number ID is present.
- Confirm access token is present and not expired.
- Confirm recipient is in international format.
- Confirm the message is inside Meta policy and customer service window requirements.
- Check Message Logs for `FAILED` and safe provider error text.

### Webhook Not Receiving

- Confirm Meta callback URL is correct.
- Confirm Verify Token matches ARBCore Settings.
- Confirm `messages` is subscribed.
- Confirm the customer sent to the connected WhatsApp API number or configured Facebook Page.
- Check recent webhook events in Message Logs.

### Messenger PSID Confusion

- Messenger uses Facebook Page PSID, not a phone number.
- Use Channel Center Messenger test-send only with a valid PSID.

### Auto Reply Not Firing

- Confirm the rule is active.
- Confirm the inbound message contains the keyword.
- Confirm the correct channel is configured.
- Check whether a duplicate provider message was ignored.
- Check Message Logs for inbound `RECEIVED` and outbound `SENT` or `FAILED`.
- Check Auto Reply Analytics for the matched rule attempt, `SENT`/`FAILED` status, success rate, and safe error preview.

### Campaign Sending Confusion

- Campaigns are draft planning only in this phase.
- Audience Preview estimates matching Contacts only and does not create delivery records.
- There is no bulk sending, broadcast automation, or fake delivery metric.
- WhatsApp broadcast sending may require approved templates and Meta policy compliance in a future phase.
- Messenger broadcast has platform limitations and permission requirements.

### Token Expired

- Generate or refresh the token in Meta.
- Save the new token in Settings.
- Do not paste the token into screenshots, tickets, or public chats.

### Wrong Phone Number ID

- Confirm the Phone Number ID belongs to the intended Meta WhatsApp number.
- Update Settings with the correct Phone Number ID.
- Re-test inbound and outbound messages.

### Verify Token Mismatch

- Copy the verify token from ARBCore Settings.
- Paste the exact same value in Meta webhook configuration.
- Re-run webhook verification.

### Messages Sent To Wrong Number

- ARBCore receives messages only for the number connected to the saved Phone Number ID.
- If the customer sends another WhatsApp number, ARBCore will not receive it.

### Permission Or Auth Status Confusion

- Open Auth Status and Permission Status.
- Confirm enforcement is still off in production beta unless a controlled staging test is planned.

### Client Workspace Confusion

- `/admin/workspaces` creates and lists workspace records only.
- New workspaces can be selected for beta/admin testing through an HTTP-only selected workspace cookie.
- The selected workspace cookie stores only the company ID.
- Clear selected workspace returns the app to the default beta fallback.
- Channel credentials must be configured separately per client workspace.
- Do not reuse or copy Welzz Stride access tokens into a client workspace.
- Verify Supabase Auth user mapping before giving a client real access.
- Production tenant switching must validate authenticated user membership and role.
- Tenant membership is report-only in beta while `TENANT_MEMBERSHIP_ENFORCED=false`.
- Use `/api/auth/tenant-access` only for safe diagnostics; it does not expose tokens, cookies, or raw sessions.
- Webhooks now have provider-routing foundation, but unmatched events still use beta fallback. Require provider matches before untrusted multi-client production.
- Strict provider routing is off by default. If enabled, unmatched provider webhooks are acknowledged but not processed into the default workspace.
- Duplicate provider IDs must be resolved before strict provider routing is enabled.
- Settings now blocks duplicate non-empty WhatsApp Phone Number IDs and Messenger Page IDs across workspaces.
- Empty provider IDs remain allowed for workspaces that are not connected to Meta yet.
- Database unique constraints for provider IDs are still future work.

### Manual Payment Status Confusion

- Open Billing.
- Confirm the subscription status and latest manual payment record.
- Do not mark a payment `CONFIRMED` unless an admin has verified it offline.
- Do not treat `PENDING` payment records as confirmed payments.
- Use the manual receipt page only as a record of what was manually entered.
- Do not block users because of plan limits in the current beta; over-limit warnings are report-only.
- Do not store card data or payment credentials.
- Gateway automation is not active yet.

### Order Message Template Confusion

- Order message templates are manual text helpers only.
- Templates use saved order fields such as order number, product/model, size, quantity, total, payment status, order status, and delivery address.
- Internal order notes are not included in generated customer messages.
- Preparing or copying a message does not send it. Staff must review the text and click Send Reply manually.
- Do not promise automatic order confirmation, payment, courier, inventory, or delivery integration in this phase.

### Order Follow-up Alert Confusion

- Order follow-ups are internal reminders for operators.
- Due means the follow-up time has passed and is not marked done.
- Upcoming means a future follow-up is scheduled.
- Done means staff manually marked the follow-up complete.
- No automatic WhatsApp, Messenger, courier, billing, or inventory action runs when a follow-up changes.

### Product Catalog Confusion

- Products are manual model records for faster order entry.
- Active products appear in the Inbox order form dropdown.
- Selecting a product can fill model name, unit price, and size helpers, but staff can still override those fields manually.
- Stock note is informational only. It does not update automatically when orders are created.
- Do not promise inventory automation, ecommerce checkout, image upload storage, courier integration, or payment gateway behavior.

### WhatsApp Media Reply Issue

- Inbox media replies support WhatsApp image and PDF only in Phase 1.
- Supported image types are JPEG, PNG, and WebP up to 5 MB.
- Supported document type is PDF up to 10 MB.
- ARBCore uploads media to Meta first, then sends by Meta media ID.
- If media fails, check `/message-logs` for `WHATSAPP / OUTBOUND / FAILED` and the safe provider error.
- Do not ask users to share access tokens, Authorization headers, or raw provider payloads.
- Do not upload sensitive customer documents unless the business has approved that workflow.
- Video, audio, sticker, and campaign media sends are not supported yet.

### WhatsApp Inbound Audio Playback Issue

- Inbox can play inbound WhatsApp audio/voice messages when the webhook stored a safe media ID.
- Audio is streamed through ARBCore. The browser must not receive the WhatsApp access token or raw Meta media URL.
- If playback fails, check that the WhatsApp Access Token is still valid and that Meta still allows the media download.
- Message Logs should show `[audio] Audio message` and an inbound media badge for audio logs.
- Other inbound media playback/download is not part of this phase.

### Messenger Live Setup Issue

- Messenger uses Facebook Page ID and customer PSID, not phone number.
- Confirm Settings has Page ID, Page Access Token presence, Messenger Verify Token, and Messenger Webhook URL.
- The production callback URL is `https://arbcore-swiftconnect.vercel.app/api/messenger/webhook`.
- The verify token in Meta must exactly match ARBCore, for example `arbcore_messenger_verify_2026`.
- Subscribe the Meta Messenger webhook to `messages` or messaging events.
- Send a message to the Page from a personal Facebook account, then check `/message-logs` and `/inbox`.
- Messenger test-send and Inbox reply require PSID. Do not use phone numbers.
- Failed Messenger sends should log `FAILED` with safe provider error details only.

### Mobile Browser Support

- Daily operator pages are supported on mobile browser: `/inbox`, `/message-logs`, `/contacts`, and `/send-messages`.
- Use `MOBILE_RESPONSIVENESS_QA_CHECKLIST.md` for Android Chrome, iPhone Safari, and tablet checks.
- Ask users to report device, browser, page, and whether horizontal scrolling appears.
- Desktop remains recommended for Meta setup, Settings token entry, Admin Workspaces, Provider Diagnostics, and Billing setup.

### Auto Reply Template Library

- Auto Reply includes a text-only Template Library for common replies such as `price`, `size`, `order`, `delivery`, `cod`, and `support`.
- Templates pre-fill the rule form but do not save automatically. Users must review and click Save.
- Template rules use the same existing keyword, match mode, priority, and active/inactive behavior as manual rules.
- Media auto-replies and AI-generated dynamic replies are not included in Template Library Phase 1.

### Auto Reply Analytics

- Auto Reply Analytics shows rule attempts, provider-accepted sends, failed sends, success rate, rule performance, and recent safe event previews.
- Failed auto replies should be reviewed in Auto Reply Analytics first, then cross-checked in Message Logs for channel/provider status.
- Analytics stores previews only. Do not request access tokens, Authorization headers, raw webhook payloads, or full customer message exports for routine support.

### Unsupported WhatsApp Messages

- Meta may send system, security, verification, interactive, button, reaction, contact, location, order, sticker, or unknown WhatsApp message types that do not include a normal customer text body.
- ARBCore logs these as safe diagnostics such as `[unsupported: system]` and shows the provider message type plus a short safe summary in Message Logs and Inbox.
- Do not request raw webhook payloads, access tokens, Authorization headers, or screenshots that show provider secrets.
- Do not promise that Meta verification/security codes can be read through WhatsApp Cloud API. Ask the user to request the code by SMS, phone call, email, or authenticator when available.

### WhatsApp Profile And Ad Referral Context

- WhatsApp Cloud API may include customer profile name in webhook contact data. ARBCore stores it as `whatsappProfileName` and uses it only as a display fallback after manual contact name.
- WhatsApp Cloud API generally does not provide customer profile photo. ARBCore shows initials/avatar fallback only.
- Click-to-WhatsApp referral context may include source type, source ID, source URL, headline, body preview, media type, and CTWA click ID. It may not appear for every message.
- Use Inbox, Contacts, Message Logs, and approved CSV exports to review safe referral context. Do not request raw webhook payloads or provider secrets.

### Conversation Quality Controls

- Inbox supports internal read/unread, starred, priority, and quick label controls.
- Priority values are Low, Normal, High, and Urgent.
- Quick labels are Hot Lead, Need Follow-up, Payment Pending, Order Issue, and General.
- New inbound messages mark conversations unread. Marking read/unread, starring, priority, and labels do not send customer messages or trigger provider actions.
- Dashboard conversation quality metrics help operators triage unread, urgent, high-priority, starred, hot-lead, and payment-pending conversations.

## Safety Rules

- Do not share access tokens.
- Do not reset the production database.
- Do not enable `AUTH_ENFORCED=true` until a mapped admin is verified.
- Do not enable `PERMISSIONS_ENFORCED=true` until permission staging tests pass.
- Do not enable `TENANT_MEMBERSHIP_ENFORCED=true` until tenant membership staging tests pass.
- Do not onboard paid external clients until `PAID_CLIENT_GO_LIVE_GATE.md` is signed off.
- Do not onboard paid clients until workspace mapping and company isolation are verified.
- Do not use beta workspace selection for untrusted client access.
- Do not claim provider success unless Message Logs show `SENT`.
- Do not claim payment success unless the manual payment record has been verified by an admin.
- Do not expose raw webhook payloads if they may contain customer data.
- Do not paste database URLs, cookies, raw sessions, authorization headers, or provider tokens into logs, screenshots, tickets, or chats.
- Do not upload CSV exports to public links or share them with unapproved users.
- Treat Auto Reply Analytics CSV as customer/business data because it can include customer keys and safe message previews.
- Treat Contacts CSV as customer/business data because it includes lead status and tags.

## Escalation Checklist

- [ ] Check latest Vercel deployment status.
- [ ] Run the read-only production verification script if route health is uncertain.
- [ ] Check Supabase database health.
- [ ] Check Meta app and channel status.
- [ ] Check ARBCore Settings for channel fields.
- [ ] Check Channel Center diagnostics.
- [ ] Check Message Logs for affected time range.
- [ ] Check the latest commit and build result.
- [ ] Follow `INCIDENT_RESPONSE_RUNBOOK.md` for the affected incident type.
- [ ] Collect the user action, page, time, channel, and safe error text.
