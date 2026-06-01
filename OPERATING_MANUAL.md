# ARBCore SwiftConnect Operating Manual

ARBCore SwiftConnect is a WhatsApp business workspace for managing contacts, campaigns, message drafts, auto replies, CRM follow-up, and account settings.

## Beta Status

This is a launch-ready beta MVP. The workspace is ready for data entry, contact management, rule setup, settings persistence, team testing, message-attempt logging, and operational review. Real WhatsApp delivery still requires a configured WhatsApp Cloud API account and webhook verification.

Do not treat local message drafts, queued replies, or failed send attempts as delivered customer messages unless the app confirms a successful WhatsApp Cloud API send.

Production-ready in this beta: Settings persistence, Contacts, Auto Reply, Dashboard statistics, Team Member duplicate checks, Send Message safety checks, and operating documentation.

Not yet implemented for full commercial launch: production OAuth/session management, billing enforcement, automated license blocking, approved-template campaign sending, and complete WhatsApp Cloud API operational monitoring.

For SaaS readiness and future paid rollout direction, use `SAAS_ARCHITECTURE_PLAN.md`, `MESSENGER_INTEGRATION_PLAN.md`, and `PAYMENT_SUBSCRIPTION_PLAN.md`.

For auth, roles, and workspace/company isolation before external client onboarding, use `AUTH_WORKSPACE_HARDENING_PLAN.md`.

For Phase 1 auth foundation details, use `AUTH_IMPLEMENTATION_PHASE_1.md`. Current beta remains single-company/demo auth, and real login enforcement is planned for a later phase.

Phase 2 adds Supabase Auth helpers plus login/logout routes, but current Enterprise Beta access remains non-blocking until route protection is enabled in a later phase.

Phase 3 adds the `AUTH_ENFORCED` flag for controlled route protection testing. It defaults off, and public Meta webhook routes must remain accessible.

Phase 4 adds Supabase Auth user mapping to Prisma users and companies. Use `AUTH_IMPLEMENTATION_PHASE_4.md` and `SUPABASE_ADMIN_USER_MAPPING.md` before enabling enforced login.

Phase 5 adds safe admin mapping verification. Use `AUTH_IMPLEMENTATION_PHASE_5.md`, `/auth/status`, and `/api/auth/me` to confirm Supabase Auth user to Prisma User to Company mapping before enabling `AUTH_ENFORCED=true`.

Phase 6 adds local and staging enforcement test readiness. Use `AUTH_IMPLEMENTATION_PHASE_6.md` and `AUTH_ENFORCEMENT_TEST_CHECKLIST.md`; do not enable `AUTH_ENFORCED=true` in production until those checks pass.

Phase 7 adds role permission readiness. Use `AUTH_IMPLEMENTATION_PHASE_7.md`, `/auth/permissions`, and `/api/auth/permissions` to review role access before enabling `PERMISSIONS_ENFORCED=true`.

Phase 8 applies permission guards to selected APIs in report-only mode. Use `AUTH_IMPLEMENTATION_PHASE_8.md` to review which Dashboard, WhatsApp Logs, Contacts, Auto Reply, and Send Messages APIs are guarded while beta behavior remains non-blocking.

## 1. Dashboard

The Dashboard is the main business overview. It shows live workspace activity such as connected WhatsApp numbers, messages sent, open conversations, active campaigns, contacts, auto-reply rules, and team members where the app has database data available.

Use it at the start of the day to check whether the workspace is healthy, whether message activity is happening, and where follow-up is needed.

## 2. Contacts

Contacts is the customer list. Each contact can store a name, WhatsApp phone number, email, source or segment, tags, status, and opt-in preference.

Use Contacts to add new leads, update customer details, search by name or phone, filter by status or tags, import CSV or Excel files, and remove test or unwanted records.

Basic Contacts workflow:

1. Open Contacts.
2. Click New Contact.
3. Enter name and phone number.
4. Optionally add email, source, tags, status, and opt-in state.
5. Click Save Contact.
6. Use search and filters to find the saved contact.
7. Use the edit button to update details.
8. Use delete only for test or unwanted contacts.

## 3. Campaigns

Campaigns is for planning bulk or segmented WhatsApp outreach. A campaign stores the campaign name, template, target segment, schedule, and sending status.

Use Campaigns to organize promotional messages, follow-up lists, and customer announcements before sending through a real WhatsApp Cloud API setup.

## 4. Send Messages

Send Messages is the message desk. It lets the team select or enter a phone number, write a message, preview the text, and record the send attempt.

If WhatsApp Cloud API is not configured, the app will not pretend a real message was sent. It will show that WhatsApp Cloud API is required to send real messages and can log the attempted message for review.

Basic Send Messages workflow:

1. Open Send Messages.
2. Choose or type the recipient phone number.
3. Select a template or write a custom message.
4. Review the preview.
5. Click Send.
6. If WhatsApp Cloud API is missing, read the warning and treat the record as an attempted message only.
7. If the API is configured and the provider accepts the request, the app can mark the message as sent.

After testing, open WhatsApp Logs to confirm the outbound message attempt, provider ID, status, and any safe error message.

## 5. Auto Reply

Auto Reply manages keyword-based replies. A rule contains a trigger keyword, reply message, match mode, priority, and active/inactive status.

Use Auto Reply for common questions such as price, delivery, payment, order status, support, or unsubscribe requests. Active rules can send live replies when WhatsApp Cloud API is configured and an inbound webhook text message matches the rule.

Basic Auto Reply workflow:

1. Open Auto Reply.
2. Click New Rule or choose a starter category.
3. Enter a trigger keyword.
4. Enter the reply message.
5. Choose the match mode and priority.
6. Keep the rule active if it should be used.
7. Click Save Rule.
8. Use the status button to activate or deactivate a rule.
9. Delete only rules that are no longer needed.

Live Auto Reply test workflow:

1. Create an active rule with keyword `price`.
2. Send a WhatsApp message containing `price` to the connected business number.
3. Open WhatsApp Logs at `/whatsapp-logs`.
4. Confirm the inbound customer message is logged as `INBOUND - RECEIVED`.
5. Confirm the auto reply is logged as `OUTBOUND - SENT` if Meta accepts it, or `OUTBOUND - FAILED` if Meta rejects it.

The app does not fake auto-reply success. It logs `SENT` only after Meta returns success.

## 6. CRM

CRM tracks sales opportunities and customer follow-up. Deals can be organized by lead stage, owner, value, next action, and due date.

Use CRM to move customers from new lead to interested, follow-up, won, or lost so the business team knows what action comes next.

## 7. Settings

Settings controls workspace configuration. Business Profile saves company name, workspace name, WhatsApp number, website, and timezone. WhatsApp/API Settings stores phone number ID, access token, verify token, and webhook URL. Notification and language preferences also save here.

The Business Profile WhatsApp number is customer-facing business copy. Actual inbound and outbound WhatsApp API traffic uses the number connected in Meta for the saved Phone Number ID.

Team Members lets owners and admins add users, change roles, deactivate users, and see friendly duplicate-email errors.

Basic Settings workflow:

1. Open Settings.
2. Update Business Profile fields and click Save.
3. Add WhatsApp/API fields when available and click Save in that panel.
4. Enter a new access token only when you want to save or replace it; saved tokens are not shown after refresh.
5. Update notifications or language and save the relevant panel.
6. Add team members with name, email, and role.
7. If a duplicate email is entered, the app shows a friendly error.

Connecting Welzz Stride real number `01958474577`:

Use `WELZZ_STRIDE_NUMBER_CONNECTION_CHECKLIST.md` as the step-by-step operational checklist before changing the live customer-facing number.

1. Confirm whether `01958474577` is currently active in the WhatsApp or WhatsApp Business app.
2. If active, it may need to be removed or disconnected before Cloud API registration.
3. In Meta Developer Dashboard, go to WhatsApp, API Setup, and Add phone number.
4. Add `+8801958474577`.
5. Verify by SMS or voice.
6. Copy the new Phone Number ID.
7. Paste the new Phone Number ID into ARBCore Settings.
8. Keep the webhook URL as `https://arbcore-swiftconnect.vercel.app/api/whatsapp/webhook`.
9. Test inbound from another number.
10. Check `/whatsapp-logs` for `INBOUND - RECEIVED`.
11. Create an Auto Reply rule and test a live reply.

## 8. WhatsApp Logs

WhatsApp Logs is the admin-facing test view for recent WhatsApp activity. It shows recent message logs and webhook event summaries without exposing access tokens or secrets.

`INBOUND` means a customer messaged the connected WhatsApp API number. `OUTBOUND` means ARBCore sent through the connected WhatsApp API number. If a customer messages another WhatsApp number, ARBCore will not receive it.

Use WhatsApp Logs during beta testing to verify:

1. Outbound Send Messages attempts.
2. Provider accepted or rejected status.
3. Inbound webhook messages.
4. Webhook event summaries.
5. Safe error messages.

Message log status meanings:

1. `SENT`: the outbound message was accepted for sending.
2. `FAILED`: the outbound message attempt failed.
3. `RECEIVED`: an inbound WhatsApp message arrived through the webhook.
4. `ATTEMPTED`: an attempted-only status if used by a future workflow.

## 9. License

License shows the current plan, usage limits, and seat/message allowance for the workspace.

Use License to review whether the business is within its current package and what needs upgrading before higher-volume messaging.

Current status is Enterprise Beta. Billing/payment enforcement is not active yet. Future paid plans should support client workspaces, feature limits, and channel-based automation for WhatsApp and Messenger.

## 10. What Works Without WhatsApp API

Without WhatsApp Cloud API, the app can still manage business settings, WhatsApp/API settings, contacts, team members, campaigns, CRM records, auto-reply rules, message drafts or attempted message logs, dashboard counts, and local AI-assisted text generation.

This is enough for preparing customer data, training the team, building message templates, and organizing the sales workflow.

Currently functional in beta:

1. Dashboard real workspace counts.
2. Business Profile save and refresh.
3. WhatsApp/API settings save and refresh, with access token hidden after save.
4. Team member create, role changes, deactivate, and duplicate-email handling.
5. Contacts create, edit, delete, search, filter, import, and duplicate-phone handling.
6. Auto Reply create, edit, activate, deactivate, delete, and AI draft assistance.
7. Send Messages attempt logging and clear no-API warning.
8. WhatsApp Logs view for safe message and webhook verification data already stored by the app.

## 11. What Requires WhatsApp Cloud API

Real WhatsApp sending requires WhatsApp Cloud API credentials and webhook setup. This includes delivering outbound messages to customers, receiving inbound WhatsApp messages automatically, processing delivery/read receipts, and triggering auto replies from real incoming customer messages.

Before production sending, confirm that the WhatsApp phone number ID, access token, verify token, webhook URL, and Meta webhook verification are fully configured.

For the full live setup walkthrough, use `META_WHATSAPP_SETUP_GUIDE.md`.

For Meta webhook setup, use this callback path:

```text
https://YOUR_DOMAIN/api/whatsapp/webhook
```

Webhook verification uses the saved Verify Token from Settings, with the server environment token as a fallback. Outbound test sends use the saved Phone Number ID and Access Token from Settings. Access tokens must remain private and are not displayed after refresh.

Live end-to-end test flow:

1. Save WhatsApp/API Settings in ARBCore.
2. Verify the Meta webhook callback.
3. Send a controlled outbound test from Send Messages.
4. Confirm the safe status is `sent_successfully`, or review `not_configured`, `validation_failed`, or `provider_error`.
5. Send a WhatsApp message to the connected business number.
6. Open WhatsApp Logs at `/whatsapp-logs`.
7. Confirm outbound logs show `SENT` or `FAILED`.
8. Confirm inbound logs show `RECEIVED`.
9. Confirm the inbound webhook returns 200 and appears in Recent Webhook Events.

## 12. Token And Privacy Warning

Treat WhatsApp access tokens, app secrets, database URLs, direct URLs, OpenAI keys, and session secrets as private credentials. Do not paste them into tickets, screenshots, public docs, or chat messages.

The Settings page accepts a WhatsApp access token for launch setup, but the token is not displayed after refresh. If a token is exposed, rotate it in Meta and update the production environment immediately.

## 13. Support And Maintenance

Before each release, run the launch checklist in `LAUNCH_CHECKLIST.md`, confirm Vercel deployment readiness, and verify the critical flows in production.

For auth readiness, open `/auth/status` after Supabase login and confirm the mode is `supabase_mapped`. The backing `/api/auth/me` endpoint returns safe status fields only and must not expose tokens, cookies, or raw Supabase sessions.

Before enforcing login, complete `AUTH_ENFORCEMENT_TEST_CHECKLIST.md` in local or staging and confirm public WhatsApp webhook routes still work.

Before enforcing role permissions, open `/auth/permissions` and confirm the current user role and permission list are correct. Permission enforcement remains off in beta unless `PERMISSIONS_ENFORCED=true`.

When permission enforcement is off, guarded APIs continue normal beta behavior. When `PERMISSIONS_ENFORCED=true` is tested in staging, unauthorized roles should receive safe 403 responses while webhook routes stay public.

For support issues, collect the affected module, approximate time, user action, friendly error message, and whether the issue happened before or after a deployment. Do not collect or share raw access tokens or database connection strings.

Known limitations:

1. Real WhatsApp sending is blocked until WhatsApp Cloud API credentials and server environment variables are configured.
2. Inbound WhatsApp messages can be received through `/api/whatsapp/webhook`, and simple live keyword auto replies are active when matching rules and WhatsApp Cloud API settings are ready.
3. Campaign sending depends on approved WhatsApp templates and a completed production send flow.
4. Authentication is demo-cookie based for MVP testing.
5. Access tokens are saved but intentionally not displayed after refresh.
6. Current beta is single-company/demo-auth mode; before onboarding external clients, real auth and company isolation must be implemented so each client sees only its own contacts, messages, settings, auto replies, and logs.
7. Webhook routes must remain public for Meta provider callbacks, but they must stay verified by provider tokens/signatures.
