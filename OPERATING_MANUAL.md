# ARBCore SwiftConnect Operating Manual

ARBCore SwiftConnect is a WhatsApp business workspace for managing contacts, manual order tracking, campaigns, message drafts, auto replies, CRM follow-up, and account settings.

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

Phase 9 adds limited local/staging permission enforcement test support. Use `AUTH_IMPLEMENTATION_PHASE_9.md` and `PERMISSION_ENFORCEMENT_TEST_CHECKLIST.md` before testing `AUTH_ENFORCED=true` with `PERMISSIONS_ENFORCED=true`.

Channel Center at `/channels` gives a safe status view for WhatsApp and Messenger setup. It shows whether IDs, tokens, and verify tokens are present, but it never displays access tokens. It also includes diagnostics, webhook URL copy helpers, a Messenger PSID test-send form, and links to Send Messages and Message Logs.

Unified Inbox at `/inbox` gives the team a business-friendly conversation view across WhatsApp and Messenger. It supports contact linking, safe replies, conversation status, team assignment, internal notes, and follow-up reminders from the selected conversation when the relevant Meta channel is configured. The app still does not fake provider success; check Message Logs for `SENT` or `FAILED` verification.

## 1. Dashboard

The Dashboard is the main business overview. It shows live workspace activity such as connected WhatsApp numbers, messages sent, open conversations, active campaigns, contacts, auto-reply rules, and team members where the app has database data available.

Use it at the start of the day to check whether the workspace is healthy, whether message activity is happening, and where follow-up is needed.

Dashboard CRM/support metrics show Inbox status counts, due follow-ups, message health, channel activity, and the 30-day Auto Reply performance snapshot. Use the quick links to jump directly to filtered Inbox views, Message Logs, Channel Center, and Auto Reply. Failed messages should be reviewed in Message Logs, failed auto replies should be checked in Auto Reply Analytics, and due follow-ups should be handled from Inbox.

## 2. Contacts

Contacts is the customer list. Each contact can store a name, WhatsApp phone number, email, source or segment, tags, status, and opt-in preference.

Use Contacts to add new leads, update customer details, search by name or phone, filter by status or tags, import CSV or Excel files, and remove test or unwanted records.

Lead statuses are standardized as New, Interested, Ordered, Delivered, Follow-up, and Lost. Older values are displayed safely when found, but new edits should use the standardized list.

Recommended tags for Welzz Stride and beta operators include `size-40`, `size-41`, `size-42`, `solm8`, `facebook`, `whatsapp`, `priority`, `cod`, and `repeat-customer`. Tags are comma-separated and normalized for easier filtering.

Basic Contacts workflow:

1. Open Contacts.
2. Click New Contact.
3. Enter name and phone number.
4. Optionally add email, source, tags, status, and opt-in state.
5. Click Save Contact.
6. Use search and filters to find the saved contact.
7. Use the edit button to update details.
8. Use delete only for test or unwanted contacts.

## 3. Orders

Orders tracks simple manual customer order records linked to a Contact or Inbox conversation. It stores product/model name, size, quantity, BDT amount fields, customer delivery details, payment status, order status, and internal notes.

Product Catalog at `/products` stores a company-scoped manual product/model list with name, SKU, BDT price, available sizes, stock note, image URL, status, and internal notes. It is a helper for order entry only. There is no ecommerce checkout, stock reservation, inventory deduction, or automatic customer message.

Order statuses are `DRAFT`, `CONFIRMED`, `PACKED`, `SHIPPED`, `DELIVERED`, and `CANCELLED`. Payment statuses are `UNPAID`, `PARTIAL`, `PAID`, and `COD`.

Phase 1 is manual tracking only. There is no payment gateway, courier integration, inventory automation, or automatic customer notification when an order is saved.

Order message templates can prepare customer-facing confirmation, payment reminder, packed, shipped, delivered follow-up, and cancellation messages from saved order data. Staff must review the generated message and click Send Reply manually from Inbox, or copy the preview from Orders. Templates do not auto-send and do not include internal order notes.

Order follow-up reminders are internal only. Use `/orders` to filter by due, upcoming, done, or no follow-up, and to save quick order status, payment status, and follow-up updates. These updates do not send automatic WhatsApp or Messenger messages.

Basic order workflow:

1. Open Inbox and select a customer conversation.
2. In the Orders section, select an active product if useful, or manually enter model, size, quantity, price, delivery charge, customer details, delivery address, payment status, order status, and notes.
3. Click Save Order.
4. Open Orders at `/orders` to filter and update order/payment status.
5. Add an internal order follow-up if staff need to check payment, delivery, or customer confirmation later.
6. Use Prepare Message in Inbox or Preview/Copy Message in Orders when a reviewed customer update is needed.
7. Use Data Exports to download Orders CSV when approved.

Basic product workflow:

1. Open Products at `/products`.
2. Create or edit a product/model with price, available sizes, stock note, image URL, and status.
3. Keep active products available for Inbox order entry.
4. Archive old products instead of deleting customer history.
5. Use Products CSV when approved.

## 4. Campaigns

Campaigns is for planning WhatsApp or Messenger outreach drafts. A campaign stores the campaign name, channel, draft status, audience note, message body, optional template name, optional schedule date, and internal notes.

Campaigns Phase 1 is draft planning only. There is no bulk sending, no broadcast automation, and no fake sent or delivered metrics. Future WhatsApp broadcast sending may require approved templates and Meta policy compliance. Messenger broadcast has platform limitations and permission requirements.

Campaign audience preview uses Contacts to estimate matching recipients from saved criteria such as contact status, tags, search text, channel preference, and limit. Preview is planning-only and does not send messages.

## 5. Send Messages

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

Use Channel Center to check whether WhatsApp and Messenger are configured before running channel tests.

WhatsApp test sending stays in Send Messages. Messenger test sending is available in Channel Center and requires a Facebook Page PSID, not a phone number.

After messages are received or sent, open Inbox at `/inbox` for a customer conversation view. Selected conversations include a contact card, reply composer, status dropdown, assignee dropdown, internal note, and follow-up reminder. WhatsApp conversations can create or link a contact from the customer phone number. The Inbox contact card can update customer name, email, lead status, and tags directly from the conversation. Messenger conversations use PSID, so full Messenger identity linking may require a future Messenger PSID contact field. WhatsApp replies require WhatsApp Cloud API configuration, and Messenger replies require a Page Access Token plus a Facebook PSID conversation. Use Message Logs when you need technical provider IDs, webhook summaries, or debug filtering.

## 6. Auto Reply

Auto Reply manages keyword-based replies. A rule contains a trigger keyword, reply message, match mode, priority, and active/inactive status.

Use Auto Reply for common questions such as price, delivery, payment, order status, support, or unsubscribe requests. Active rules can send live replies when WhatsApp Cloud API is configured and an inbound webhook text message matches the rule.

The Auto Reply Template Library provides ready-made text templates for common business replies such as `price`, `size`, `order`, `delivery`, `cod`, and `support`. Select a template, review the keyword and reply text, then save it as an active rule. Templates are starting points and are not saved automatically.

Template Library Phase 1 is text-only. Media auto-replies, AI-generated dynamic replies, and campaign sending are not included in this phase.

Auto Reply Analytics shows matched rule attempts, provider-accepted sends, failed sends, success rate, rule performance, and recent safe event previews. It does not show tokens, raw webhook payloads, full provider responses, or full customer payloads. Use it to see which rules are firing and which rules need provider/configuration review.

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
6. Open Auto Reply Analytics to confirm the matching rule records `SENT` or `FAILED` with a safe preview.

The app does not fake auto-reply success. It logs `SENT` only after Meta returns success.

## 7. CRM

CRM tracks sales opportunities and customer follow-up. Deals can be organized by lead stage, owner, value, next action, and due date.

Use CRM to move customers from new lead to interested, follow-up, won, or lost so the business team knows what action comes next.

## 8. Settings

Settings controls workspace configuration. Business Profile saves company name, workspace name, WhatsApp number, website, and timezone. WhatsApp/API Settings stores phone number ID, access token, verify token, and webhook URL. Messenger / Page API Settings stores Facebook Page ID, Page Access Token, Messenger Verify Token, and Messenger Webhook URL. Notification and language preferences also save here.

The Business Profile WhatsApp number is customer-facing business copy. Actual inbound and outbound WhatsApp API traffic uses the number connected in Meta for the saved Phone Number ID.

Team Members lets owners and admins add users, change roles, deactivate users, and see friendly duplicate-email errors.

Channel Center links back to Settings for WhatsApp/API and Messenger/Page API setup. It is a status page only and does not reveal tokens.

Basic Settings workflow:

1. Open Settings.
2. Update Business Profile fields and click Save.
3. Add WhatsApp/API fields when available and click Save in that panel.
4. Add Messenger / Page API fields only when preparing Meta Messenger setup.
5. Enter a new access token only when you want to save or replace it; saved WhatsApp and Messenger tokens are not shown after refresh.
6. Update notifications or language and save the relevant panel.
7. Add team members with name, email, and role.
8. If a duplicate email is entered, the app shows a friendly error.

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

## 9. Message Logs

Message Logs is the admin-facing test view for recent WhatsApp and Messenger activity. The existing route remains `/whatsapp-logs`, and `/message-logs` is also available as an alias. It shows recent message logs and webhook event summaries without exposing access tokens or secrets.

Inbox at `/inbox` is the business conversation view. It groups existing message logs by WhatsApp phone number or Messenger PSID and shows the latest customer thread. The selected conversation includes linked contact profile details, contact creation for WhatsApp conversations, quick contact edits, a reply composer, status management, assignment, internal notes, and follow-up reminders.

Inbox status meanings:

1. `OPEN`: needs attention.
2. `PENDING`: waiting or follow-up is needed.
3. `CLOSED`: handled.

Assignment helps the team see who owns follow-up. A reply is logged as `SENT` only after Meta accepts it, and provider failures are logged as `FAILED`.

Contact linking helps the CRM workflow. WhatsApp conversations match contacts by phone number, including simple local/international Bangladesh variants such as `01XXXXXXXXX` and `8801XXXXXXXXX`. Inbox-created WhatsApp contacts appear in the Contacts module. Messenger conversations currently show the PSID limitation until a dedicated Messenger PSID contact field is added.

Internal notes are CRM-only team notes and are never sent to WhatsApp or Messenger customers. Follow-up reminders help track pending conversations:

1. `Due`: the follow-up time is now or overdue.
2. `Upcoming`: the follow-up time is scheduled for later.
3. `Done`: the follow-up has been completed.
4. `None`: no follow-up reminder is set.

`INBOUND` means a customer messaged the connected WhatsApp API number or configured Facebook Page. `OUTBOUND` means ARBCore sent through a configured provider. If a customer messages another WhatsApp number or unconnected Facebook Page, ARBCore will not receive it.

Use WhatsApp Logs during beta testing to verify:

1. Outbound Send Messages attempts.
2. Provider accepted or rejected status.
3. Inbound webhook messages.
4. Webhook event summaries.
5. Safe error messages.
6. Messenger inbound Page messages after `/api/messenger/webhook` setup.

Channel Center links to Logs for inbound/outbound verification across both channels.

Use the diagnostics section in Channel Center to see outbound readiness, webhook readiness, and missing setup items for WhatsApp and Messenger.

The logs page supports filters by channel, direction, status, result limit, and search. Search can be used for phone number, Messenger PSID, message preview, or provider message ID.

## 9A. Data Exports

Data Exports at `/exports` lets approved operators download workspace-scoped CSV files for Contacts, Message Logs, Billing records, Products, Orders, and Auto Reply Analytics.

Use `DATA_EXPORT_READINESS_PLAN.md` before sharing export files. Exports may include customer names, phone numbers, emails, lead statuses, tags, message previews, payment references, and internal notes. Share carefully and never upload export files to public links.

Current export routes:

1. `/api/exports/contacts`: Contacts CSV.
2. `/api/exports/message-logs`: Message Logs CSV with optional channel, direction, and status filters.
3. `/api/exports/billing`: Billing/payment records CSV.
4. `/api/exports/auto-reply-analytics`: Auto Reply Analytics CSV with optional channel and day-range filters.
5. `/api/exports/orders`: Orders CSV.
6. `/api/exports/products`: Products CSV.

Exports may contain customer or business data such as phone numbers, Messenger PSIDs, message previews, payment notes, and auto-reply previews. Exports do not include access tokens, database URLs, cookies, raw sessions, raw webhook payloads, or provider access tokens. Do not share exported CSV files through public links.

Message log status meanings:

1. `SENT`: the outbound message was accepted for sending.
2. `FAILED`: the outbound message attempt failed.
3. `RECEIVED`: an inbound WhatsApp message arrived through the webhook.
4. `ATTEMPTED`: an attempted-only status if used by a future workflow.

Messenger setup:

Use `MESSENGER_SETUP_GUIDE.md`. The Messenger webhook URL is:

```text
https://YOUR_DOMAIN/api/messenger/webhook
```

Messenger Send API can send text messages when Page settings are configured. Messenger live auto-reply can respond to active keyword rules. The app does not fake Messenger sending success and logs `SENT` only after Meta accepts the request.

## 9. License

License shows the current plan, usage limits, and seat/message allowance for the workspace.

Use License to review whether the business is within its current package and what needs upgrading before higher-volume messaging.

Current status is Enterprise Beta. Manual payment and subscription tracking is available from Billing at `/billing`, but billing/payment enforcement is not active yet. Admins can manually track a plan, status, period, payment amount, method, reference, and notes after offline verification. Gateway automation is not active, payment success is not faked, and card data must never be stored.

Billing Summary shows confirmed payment totals, pending payment totals, last payment, current period end, and days remaining. Only `CONFIRMED` records count as confirmed payments. `PENDING` records are manual follow-up items, not successful payments. Payment History includes printable manual receipts.

Plan Usage shows contacts, team members, auto-reply rules, monthly messages, inbox conversations, and enabled channels against the current plan. These limits are report-only in beta. Over-limit warnings help with planning but do not block features yet.

Future paid plans should support client workspaces, feature limits, and channel-based automation for WhatsApp and Messenger.

## 10. What Works Without WhatsApp API

Without WhatsApp Cloud API, the app can still manage business settings, WhatsApp/API settings, Messenger foundation settings, contacts, team members, campaigns, CRM records, auto-reply rules, message drafts or attempted message logs, dashboard counts, and local AI-assisted text generation.

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
9. Messenger settings and inbound webhook foundation, without claiming Messenger send success.

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

## 11A. What Requires Messenger Page API

Real Messenger sending requires a Meta App, Facebook Page, Messenger product, Page Access Token, webhook verification, and required Meta permissions.

Before production Messenger testing, follow `MESSENGER_SETUP_GUIDE.md`.

Live Messenger activation flow:

1. Select the Facebook Page in Meta.
2. Copy the Facebook Page ID.
3. Generate the Page Access Token.
4. Save Page ID, Page Access Token, Messenger Verify Token, and Messenger Webhook URL in ARBCore Settings.
5. Use callback URL `https://arbcore-swiftconnect.vercel.app/api/messenger/webhook`.
6. Use a verify token such as `arbcore_messenger_verify_2026` and make sure Meta and ARBCore match exactly.
7. Subscribe to Messenger `messages` or messaging events.
8. Send a message to the Page from a personal Facebook account.
9. Check Message Logs and Inbox, then reply from Inbox.
10. Test an active Auto Reply rule.

Messenger foundation test flow:

1. Save Messenger / Page API Settings in ARBCore.
2. Configure Meta webhook callback at `/api/messenger/webhook`.
3. Subscribe to `messages`.
4. Send a message to the connected Facebook Page.
5. Open `/whatsapp-logs`.
6. Confirm the inbound log shows channel `MESSENGER`, direction `INBOUND`, and status `RECEIVED`.
7. Create an active Auto Reply rule with keyword `price`.
8. Send a Messenger message containing `price` to the connected Facebook Page.
9. Confirm the outbound auto reply logs `MESSENGER`, `OUTBOUND`, and either `SENT` or `FAILED`.
10. Use `/api/messenger/test-send` for controlled provider-backed text sending. It does not fake real Messenger sending.

## 12. Token And Privacy Warning

Treat WhatsApp access tokens, Messenger Page Access Tokens, app secrets, database URLs, direct URLs, OpenAI keys, and session secrets as private credentials. Do not paste them into tickets, screenshots, public docs, or chat messages.

The Settings page accepts WhatsApp and Messenger access tokens for launch setup, but tokens are not displayed after refresh. If a token is exposed, rotate it in Meta and update the production environment immediately.

## 12A. WhatsApp Media Replies From Inbox

WhatsApp Media Send Phase 1 supports image and PDF replies from the Inbox reply composer. Text replies continue to work as before.

Supported attachments:

1. Images: JPEG, PNG, and WebP up to 5 MB.
2. Documents: PDF up to 10 MB.

ARBCore uploads the media to Meta WhatsApp Cloud API first, then sends the customer a WhatsApp message using the returned Meta media ID. Success is logged only after Meta accepts the final message. Failed upload or send attempts are logged as `FAILED` with safe provider error details only.

Video, audio, stickers, and bulk campaign media sending are not supported in this phase. Do not upload sensitive customer documents unless the business has approved that usage.

## 13. Support And Maintenance

Before each release, run the launch checklist in `LAUNCH_CHECKLIST.md`, confirm Vercel deployment readiness, and verify the critical flows in production.

Mobile browser support is intended for daily operations such as `/inbox`, `/message-logs`, `/contacts`, and `/send-messages`. Use `MOBILE_RESPONSIVENESS_QA_CHECKLIST.md` to test Android Chrome, iPhone Safari, and tablet widths. Desktop remains recommended for Meta setup, Settings token entry, Admin Workspaces, Provider Diagnostics, and Billing setup.

For beta release readiness, review `BETA_RELEASE_NOTES.md`, `PRODUCTION_QA_REPORT.md`, `SECURITY_QA_REPORT.md`, and `MIGRATION_AUDIT.md`.

For auth readiness, open `/auth/status` after Supabase login and confirm the mode is `supabase_mapped`. The backing `/api/auth/me` endpoint returns safe status fields only and must not expose tokens, cookies, or raw Supabase sessions.

Before enforcing login, complete `AUTH_ENFORCEMENT_TEST_CHECKLIST.md` in local or staging and confirm public WhatsApp webhook routes still work.

Before enforcing role permissions, open `/auth/permissions` and confirm the current user role and permission list are correct. Permission enforcement remains off in beta unless `PERMISSIONS_ENFORCED=true`.

When permission enforcement is off, guarded APIs continue normal beta behavior. When `PERMISSIONS_ENFORCED=true` is tested in staging, unauthorized roles should receive safe 403 responses while webhook routes stay public.

Settings and Team APIs are also prepared with report-only permission guards. Keep production permission enforcement off until the checklist passes.

For support issues, collect the affected module, approximate time, user action, friendly error message, and whether the issue happened before or after a deployment. Do not collect or share raw access tokens or database connection strings.

For client onboarding and beta support, use `CLIENT_ONBOARDING_GUIDE.md`, `BETA_FEEDBACK_FORM.md`, and `SUPPORT_HANDOVER_NOTE.md`. These documents cover the beta onboarding flow, structured tester feedback, support URLs, common issues, escalation steps, and token safety rules.

Known limitations:

1. Real WhatsApp sending is blocked until WhatsApp Cloud API credentials and server environment variables are configured.
2. Inbound WhatsApp messages can be received through `/api/whatsapp/webhook`, and simple live keyword auto replies are active when matching rules and WhatsApp Cloud API settings are ready.
3. Campaign sending depends on approved WhatsApp templates and a completed production send flow.
4. Authentication is demo-cookie based for MVP testing.
5. Access tokens are saved but intentionally not displayed after refresh.
6. Current beta is single-company/demo-auth mode; before onboarding external clients, real auth and company isolation must be implemented so each client sees only its own contacts, messages, settings, auto replies, and logs.
7. Webhook routes must remain public for Meta provider callbacks, but they must stay verified by provider tokens/signatures.
8. Messenger Send API and live Messenger auto-reply require a configured Page Access Token and may require Meta permissions/app review for production.
