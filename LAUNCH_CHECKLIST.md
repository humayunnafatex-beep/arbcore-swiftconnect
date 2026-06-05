# ARBCore SwiftConnect Launch Checklist

Use this checklist before each production launch or rollback.

For beta release readiness, review `BETA_RELEASE_NOTES.md`, `PRODUCTION_QA_REPORT.md`, `SECURITY_QA_REPORT.md`, and `MIGRATION_AUDIT.md`.

For Beta v1.0 release packaging and handover, review `BETA_V1_RELEASE_SUMMARY.md`, `EXECUTIVE_HANDOVER_SUMMARY.md`, and `TECHNICAL_HANDOVER_INDEX.md`.

For final Beta v1.0 stakeholder approval, complete `BETA_V1_STAKEHOLDER_REVIEW_CHECKLIST.md`.

After the `v1.0.0-beta` tag is created and before deploying or expanding beta access, complete `BETA_V1_DEPLOYMENT_READINESS.md`.

For the operator deployment guide, use `BETA_V1_INTERNAL_DEPLOYMENT_RUNBOOK.md`.

For beta client onboarding and support handover, review `CLIENT_ONBOARDING_GUIDE.md`, `BETA_FEEDBACK_FORM.md`, and `SUPPORT_HANDOVER_NOTE.md`.

For Welzz Stride internal beta operations, use `WELZZ_STRIDE_INTERNAL_BETA_RUNBOOK.md`.

For post-deployment verification, review `PRODUCTION_DEPLOYMENT_VERIFICATION.md` and `PRODUCTION_MANUAL_QA_CHECKLIST.md`. The optional read-only script is `scripts/verify-production.mjs`.
The script now includes a safe environment readiness audit that reads the shell environment and local `.env` file, reports missing/unsafe values by name only, and never prints tokens or secrets.

For Supabase production migration verification, use `SUPABASE_PRODUCTION_MIGRATION_CHECKLIST.md`.

Before applying Prisma migrations to Supabase production, complete `PRODUCTION_MIGRATION_READINESS_CHECKLIST.md` and review `SUPABASE_DB_CONNECTION_GUIDE.md`.

For observability and incident readiness, review `OBSERVABILITY_AND_MONITORING_PLAN.md`, `INCIDENT_RESPONSE_RUNBOOK.md`, and `PRODUCTION_MONITORING_CHECKLIST.md`.

For data export readiness, review `DATA_EXPORT_READINESS_PLAN.md` and confirm `/exports` is used only by approved operators.

For client workspace setup, review `CLIENT_WORKSPACE_ONBOARDING_PLAN.md` and `/admin/workspaces`.

For workspace isolation QA, review `WORKSPACE_ISOLATION_QA_REPORT.md` and run `WORKSPACE_SWITCHING_TEST_CHECKLIST.md`.

For tenant membership readiness, review `TENANT_MEMBERSHIP_ENFORCEMENT_PLAN.md`, `/auth/tenant-access`, and `/api/auth/tenant-access`.

For staging enforcement tests and paid client approval, review `TENANT_ENFORCEMENT_STAGING_CHECKLIST.md`, `PAID_CLIENT_GO_LIVE_GATE.md`, and `ENFORCEMENT_FLAGS_REFERENCE.md`.

For provider webhook routing, review `PROVIDER_WEBHOOK_ROUTING_PLAN.md`.

For strict provider routing readiness, review `STRICT_PROVIDER_WEBHOOK_ROUTING.md`.

For provider ID uniqueness readiness, review `PROVIDER_ID_UNIQUENESS_PLAN.md` and `/admin/provider-diagnostics`.

Settings save now blocks duplicate non-empty WhatsApp Phone Number IDs and Messenger Page IDs across workspaces. Empty provider IDs remain allowed, and database unique constraints are still future work.

For live Meta WhatsApp Cloud API setup, follow `META_WHATSAPP_SETUP_GUIDE.md` before running outbound or inbound production tests.

For Welzz Stride's real number setup, follow `WELZZ_STRIDE_NUMBER_CONNECTION_CHECKLIST.md`.

For SaaS, Messenger, and payment readiness, review `SAAS_ARCHITECTURE_PLAN.md`, `MESSENGER_INTEGRATION_PLAN.md`, and `PAYMENT_SUBSCRIPTION_PLAN.md`.

For Messenger/Facebook Page setup, follow `MESSENGER_SETUP_GUIDE.md`.

Before onboarding external clients, review `AUTH_WORKSPACE_HARDENING_PLAN.md`.

For Phase 1 auth foundation scope, review `AUTH_IMPLEMENTATION_PHASE_1.md`.

Phase 2 Supabase Auth helpers and login UI may exist, but app-route login enforcement is still disabled.

For controlled auth enforcement testing, review `AUTH_IMPLEMENTATION_PHASE_3.md`.

Before enabling auth enforcement, review `AUTH_IMPLEMENTATION_PHASE_4.md`, `AUTH_IMPLEMENTATION_PHASE_5.md`, `AUTH_IMPLEMENTATION_PHASE_6.md`, `AUTH_ENFORCEMENT_TEST_CHECKLIST.md`, and `SUPABASE_ADMIN_USER_MAPPING.md`.

Before enabling permission enforcement, review `AUTH_IMPLEMENTATION_PHASE_7.md`.

For report-only guarded API rollout, review `AUTH_IMPLEMENTATION_PHASE_8.md`.

For limited local/staging permission enforcement tests, review `AUTH_IMPLEMENTATION_PHASE_9.md` and `PERMISSION_ENFORCEMENT_TEST_CHECKLIST.md`.

## 1. Environment Variables

- [ ] `DATABASE_URL` is set to the production pooled PostgreSQL URL.
- [ ] `DIRECT_URL` is set to the direct PostgreSQL migration URL.
- [ ] `npm.cmd run verify:production` classifies `DATABASE_URL` and `DIRECT_URL` without printing either value.
- [ ] Any `DIRECT_URL` pooled warning is resolved before running Prisma production migrations.
- [ ] `SESSION_SECRET` is long, random, private, and stored only in platform secrets.
- [ ] `NEXT_PUBLIC_APP_URL` matches the production domain.
- [ ] `OPENAI_API_KEY` is blank for beta fallback mode or set only in server secrets.
- [ ] `WHATSAPP_ACCESS_TOKEN` is set only when real WhatsApp sending is approved.
- [ ] `WHATSAPP_PHONE_NUMBER_ID` matches the Meta phone number.
- [ ] `WHATSAPP_VERIFY_TOKEN` matches the token configured in Meta webhooks, or the saved Settings verify token is used.
- [ ] `WHATSAPP_APP_SECRET` is set before trusting webhook signatures.
- [ ] `MESSENGER_VERIFY_TOKEN` is set only if using environment fallback for Messenger webhook verification.
- [ ] `AUTH_ENFORCED=false`, `PERMISSIONS_ENFORCED=false`, `TENANT_MEMBERSHIP_ENFORCED=false`, and `STRICT_PROVIDER_WEBHOOK_ROUTING=false` remain the Beta v1.0 production defaults unless staging approval is complete.
- [ ] `npm.cmd run verify:production` environment audit has no blockers and any warnings are understood.
- [ ] No real values are committed to Git.

## 2. Vercel Deployment

- [ ] Latest `main` commit is pushed.
- [ ] Vercel build is successful.
- [ ] Production deployment is Ready.
- [ ] `/api/health` returns success.
- [ ] Production domain uses HTTPS.
- [ ] `PRODUCTION_DEPLOYMENT_VERIFICATION.md` has been completed after deployment.
- [ ] `PRODUCTION_MANUAL_QA_CHECKLIST.md` has been completed for critical modules.
- [ ] Optional `npm.cmd run verify:production` read-only checks pass or expected auth-gated responses are reviewed.
- [ ] `PRODUCTION_MONITORING_CHECKLIST.md` has been completed after deployment.
- [ ] Support owner can access Vercel and Supabase logs.
- [ ] Incident response owner has reviewed `INCIDENT_RESPONSE_RUNBOOK.md`.
- [ ] `/exports` loads and CSV export access is limited to approved operators.
- [ ] Exported CSV files are not shared through public links.
- [ ] Contacts, Message Logs, Billing Records, Products, Orders, and Auto Reply Analytics CSV downloads are available from `/exports`.
- [ ] CSV exports are company-scoped and do not include tokens, raw webhook payloads, cookies, sessions, database URLs, or provider secrets.

## 2A. Beta Client Onboarding Docs

- [ ] `BETA_V1_STAKEHOLDER_REVIEW_CHECKLIST.md` has been completed for final stakeholder review and sign-off.
- [ ] `BETA_V1_DEPLOYMENT_READINESS.md` has been completed after the `v1.0.0-beta` tag and before deployment or expanded beta access.
- [ ] `BETA_V1_INTERNAL_DEPLOYMENT_RUNBOOK.md` is used by the deployment operator.
- [ ] `CLIENT_ONBOARDING_GUIDE.md` has been reviewed before onboarding a tester.
- [ ] `CLIENT_WORKSPACE_ONBOARDING_PLAN.md` has been reviewed before creating a separate client workspace.
- [ ] `/admin/workspaces` lists the expected workspace records without exposing tokens.
- [ ] Select Workspace works only as beta/admin testing preparation.
- [ ] Clear Selected Workspace restores the default beta fallback.
- [ ] New client workspaces are not treated as production client access until auth mapping is verified.
- [ ] Workspace isolation QA findings are reviewed before beta client testing.
- [ ] Workspace switching test checklist passes for Contacts, Auto Reply, Campaigns, Billing, Inbox, and Message Logs.
- [ ] `BETA_FEEDBACK_FORM.md` is ready for the tester after the demo.
- [ ] `SUPPORT_HANDOVER_NOTE.md` is available to the support/admin team.
- [ ] Tester is reminded not to share or screenshot access tokens.
- [ ] Tester understands WhatsApp and Messenger success must be verified from Message Logs.
- [ ] Tester understands Auto Reply performance and failed rule sends can be reviewed from Auto Reply Analytics.

## 3. Supabase Migration

- [ ] Supabase project is healthy.
- [ ] Database backups are enabled.
- [ ] `PRODUCTION_MIGRATION_READINESS_CHECKLIST.md` has been completed before applying migrations.
- [ ] `SUPABASE_DB_CONNECTION_GUIDE.md` has been reviewed for pooled vs direct URL classification.
- [ ] `npx prisma migrate deploy` has run for pending migrations.
- [ ] `npx prisma generate` has run after schema changes.
- [ ] Basic record counts look correct after deploy.
- [ ] `SUPABASE_PRODUCTION_MIGRATION_CHECKLIST.md` has been reviewed for latest migrations.

## 4. Settings QA

- [ ] Business Profile saves and persists after refresh.
- [ ] WhatsApp/API settings save and persist after refresh.
- [ ] Saved access token is not returned or displayed after refresh.
- [ ] Channel Center opens at `/channels`.
- [ ] `/api/channels/status` returns safe JSON with token presence booleans only.
- [ ] `/api/channels/diagnostics` returns safe readiness JSON and missing field names only.
- [ ] Channel Center shows WhatsApp and Messenger setup status without displaying tokens.
- [ ] Webhook copy text contains only webhook URL/path and no secrets.
- [ ] Inbox opens at `/inbox` and shows a conversation list when message logs exist.
- [ ] Inbox reply composer appears when a conversation is selected.
- [ ] Inbox conversations show `OPEN` by default when no saved state exists.
- [ ] Inbox status filter works for All, Open, Pending, and Closed.
- [ ] Inbox assignee filter works for All, Unassigned, and team members.
- [ ] Inbox status update saves and persists.
- [ ] Inbox assign and unassign saves and persists.
- [ ] WhatsApp conversation shows linked contact when phone matches an existing contact.
- [ ] WhatsApp conversation can create a new contact from the Inbox contact card.
- [ ] Inbox-created contact appears in the Contacts module.
- [ ] Duplicate WhatsApp contact phone from Inbox shows a friendly error.
- [ ] Linked contact quick edit saves name, email, status, and tags.
- [ ] Linked contact card shows lead status and tag badges.
- [ ] Inbox contact status and tag filters work when linked WhatsApp contacts exist.
- [ ] Messenger conversation explains PSID contact-linking limitation without pretending it is linked.
- [ ] Inbox internal note saves and reloads.
- [ ] Internal note does not create a customer MessageLog entry.
- [ ] Inbox follow-up date saves and reloads.
- [ ] Inbox follow-up badges show Due, Upcoming, Done, or None correctly.
- [ ] Inbox follow-up filter works for All, None, Due, Upcoming, and Done.
- [ ] Clear follow-up removes the reminder and resets done state.
- [ ] Team duplicate email returns a friendly error.

## 4B. Billing QA

- [ ] Billing opens at `/billing`.
- [ ] Subscription GET returns a safe manual beta subscription shape.
- [ ] Manual subscription update saves plan, status, period dates, and notes.
- [ ] Manual payment record create validates amount and status.
- [ ] Payment history shows date, amount, method, status, and reference.
- [ ] Billing Summary shows confirmed total, pending total, last payment, period end, and days remaining.
- [ ] Confirmed total counts only `CONFIRMED` payment records.
- [ ] Pending total counts only `PENDING` payment records.
- [ ] View Receipt opens a printable manual receipt page.
- [ ] Receipt shows manual-payment disclaimer and no secrets.
- [ ] License links to Billing and still states billing enforcement is not active.
- [ ] Dashboard shows Billing Overview with plan, status, pending payments, and last payment.
- [ ] Plan Usage section loads in Billing.
- [ ] `/api/billing/usage` returns safe report-only usage data.
- [ ] License shows compact plan usage.
- [ ] Dashboard shows Plan Usage Snapshot.
- [ ] Over-limit warnings are report-only and do not block features.
- [ ] Payment gateway automation is not presented as active.
- [ ] No card data or payment credentials are stored.
- [ ] Admin confirms payment manually before marking it `CONFIRMED`.
- [ ] Billing CSV export downloads manual payment records only and does not include card data or gateway secrets.
- [ ] Auto Reply Analytics CSV export downloads safe previews only and does not include provider secrets or raw payloads.

## 4A. Auth Mapping QA

- [ ] Keep `AUTH_ENFORCED=false` for production Enterprise Beta until admin mapping is verified.
- [ ] Open `/login` and sign in with the Supabase Auth admin user.
- [ ] Open `/auth/status`.
- [ ] Confirm `/api/auth/me` returns safe JSON only.
- [ ] Confirm mode is `supabase_mapped`.
- [ ] Confirm Prisma user mapped is `Yes`.
- [ ] Confirm role, company name, and company plan are correct.
- [ ] Confirm `/auth/status` says local/staging enforcement testing is safe only for a mapped `OWNER` or `ADMIN`.
- [ ] Complete `AUTH_ENFORCEMENT_TEST_CHECKLIST.md` in local or staging before production enforcement.
- [ ] Open `/auth/permissions`.
- [ ] Confirm `/api/auth/permissions` returns safe JSON only.
- [ ] Confirm `PERMISSIONS_ENFORCED=false` for current Enterprise Beta unless a staging test is planned.
- [ ] Confirm the current role permission list is correct.
- [ ] Confirm guarded APIs still work in report-only mode: Dashboard statistics, WhatsApp Logs, Contacts, Auto Reply, and Send Messages.
- [ ] Confirm Settings and Team APIs still work in report-only mode.
- [ ] Before staging permission enforcement, complete `PERMISSION_ENFORCEMENT_TEST_CHECKLIST.md`.
- [ ] Confirm `/api/auth/permissions` remains available for diagnostics.
- [ ] Confirm no tokens, cookies, raw sessions, or service-role keys are displayed.
- [ ] Confirm public WhatsApp webhook routes remain public.
- [ ] Confirm `/admin/workspaces` remains beta/admin-assisted and does not switch the current session.
- [ ] Confirm selected workspace cookie stores only a workspace ID and is not treated as tenant security.
- [ ] Open `/auth/tenant-access`.
- [ ] Confirm `/api/auth/tenant-access` returns safe JSON only.
- [ ] Confirm tenant membership is report-only with `TENANT_MEMBERSHIP_ENFORCED=false`.
- [ ] Confirm paid client access is not enabled until user-company membership validation is enforced.
- [ ] Complete `TENANT_ENFORCEMENT_STAGING_CHECKLIST.md` before any enforcement flag is tested outside local/staging.
- [ ] Complete `PAID_CLIENT_GO_LIVE_GATE.md` before onboarding a paid external client.
- [ ] Review `ENFORCEMENT_FLAGS_REFERENCE.md` before changing enforcement flags.
- [ ] Confirm production SaaS switching is still blocked until user/company membership validation is implemented.
- [ ] Confirm WhatsApp inbound webhook routing matches by Phone Number ID when available.
- [ ] Confirm Messenger inbound webhook routing matches by Page ID when available.
- [ ] Confirm unmatched provider webhooks are not treated as production multi-client safe while beta fallback remains active.
- [ ] Confirm `STRICT_PROVIDER_WEBHOOK_ROUTING=false` unless strict routing has been tested in local/staging.
- [ ] Confirm Channel Center shows strict provider routing status.
- [ ] Confirm Admin Workspaces shows WhatsApp Phone Number ID and Messenger Page ID presence only.
- [ ] Confirm `/admin/provider-diagnostics` shows zero duplicate WhatsApp Phone Number IDs.
- [ ] Confirm `/admin/provider-diagnostics` shows zero duplicate Messenger Page IDs.

## 5. Contacts QA

- [ ] Contact create works.
- [ ] Contact edit works.
- [ ] Contact status dropdown includes New, Interested, Ordered, Delivered, Follow-up, and Lost.
- [ ] Contact tags save as comma-separated normalized tags.
- [ ] Contact filters work for status, tag, and search.
- [ ] Contact delete asks for confirmation and works.
- [ ] Duplicate phone returns a friendly error.
- [ ] Search and filters still work.

## 6. Auto Reply QA

- [ ] Rule create works.
- [ ] Rule edit works.
- [ ] Rule deactivate asks for confirmation.
- [ ] Rule activate works.
- [ ] Rule delete asks for confirmation and works.
- [ ] Active rule with keyword `price` matches an inbound WhatsApp message containing `price`.
- [ ] Matching inbound message logs `INBOUND - RECEIVED`.
- [ ] Auto reply logs `OUTBOUND - SENT` only when Meta accepts the send.
- [ ] Auto reply logs `OUTBOUND - FAILED` when Meta rejects the send.
- [ ] Auto Reply Analytics shows attempted, sent, failed, success rate, rule performance, and recent events.
- [ ] Auto Reply Analytics uses safe previews only and does not show tokens, raw webhook payloads, or provider secrets.
- [ ] Failed auto replies can be cross-checked in Message Logs.
- [ ] Replayed duplicate inbound provider message does not send a second auto reply.

## 6A. Campaign Draft QA

- [ ] Campaigns opens at `/campaigns`.
- [ ] Campaign draft create works.
- [ ] Campaign draft edit works.
- [ ] Campaign archive works.
- [ ] Campaign audience criteria saves and reloads.
- [ ] Audience preview loads matching Contacts.
- [ ] Audience preview count/list respects status, tags, search, channel, and limit criteria.
- [ ] Audience preview clearly says no messages will be sent.
- [ ] Filters work for status, channel, and search.
- [ ] No send button exists on the Campaigns page.
- [ ] Existing campaign send endpoint returns disabled/safe response.
- [ ] No bulk messages are sent.
- [ ] No sent/delivered campaign metrics are faked.
- [ ] Dashboard shows draft, ready, and audience-criteria campaign counts only.

## 7. Send Messages QA

- [ ] Phone and message are required.
- [ ] Missing WhatsApp Cloud API shows: `WhatsApp Cloud API is required to send real messages.`
- [ ] The app does not claim success unless the provider accepts the send.
- [ ] Message attempts are logged without exposing secrets.
- [ ] Provider errors show a friendly message and never include the access token.

## 8. Dashboard QA

- [ ] Dashboard loads without visible errors.
- [ ] Contacts, messages, conversations, auto replies, campaigns, and team counts load.
- [ ] Dashboard shows Support Inbox Overview metrics.
- [ ] Dashboard shows Follow-up Overview metrics.
- [ ] Dashboard shows Message Health metrics.
- [ ] Dashboard shows Channel Activity metrics.
- [ ] Dashboard shows Auto Reply Performance metrics for the last 30 days.
- [ ] Dashboard shows Lead Status Snapshot metrics.
- [ ] Dashboard shows Order Operations metrics.

## 5A. Orders QA

- [ ] Products opens at `/products`.
- [ ] Create, edit, filter, and archive product records work.
- [ ] Active product appears in Inbox order form product dropdown.
- [ ] Selecting a product fills model name, unit price, and available size helper.
- [ ] Product selection still allows manual override of model, size, and price.
- [ ] Products CSV export downloads manual product/model records only.
- [ ] Orders opens at `/orders`.
- [ ] Create order from Inbox conversation works.
- [ ] Order appears in `/orders`.
- [ ] Order status can update to Draft, Confirmed, Packed, Shipped, Delivered, and Cancelled.
- [ ] Payment status can update to Unpaid, Partial, Paid, and COD through quick update.
- [ ] Order follow-up can be scheduled, marked done, cleared, and filtered by Due, Upcoming, Done, and None.
- [ ] Dashboard Order Operations links open due follow-ups and unpaid orders.
- [ ] Orders CSV export downloads manual order records only.
- [ ] Orders CSV includes follow-up date and follow-up done fields.
- [ ] Saving an order does not send an automatic WhatsApp or Messenger message.
- [ ] Saving quick status/payment/follow-up updates does not send an automatic WhatsApp or Messenger message.
- [ ] Inbox Prepare Message fills the reply composer from selected order data without auto-sending.
- [ ] Orders Preview/Copy Message generates reviewed customer text without sending.
- [ ] Generated order messages do not include internal notes.
- [ ] No payment gateway, courier, or inventory automation is presented as active.
- [ ] Product Catalog does not claim ecommerce checkout, stock deduction, or image upload storage.
- [ ] Dashboard quick links open filtered Inbox and Message Logs views.
- [ ] Due follow-up link opens `/inbox?followUp=DUE`.
- [ ] Failed messages link opens `/message-logs?status=FAILED`.
- [ ] Empty or low-data workspaces still render cleanly.

## 9. WhatsApp Cloud API QA

- [ ] `META_WHATSAPP_SETUP_GUIDE.md` has been reviewed for the current production domain.
- [ ] The active customer WhatsApp number is confirmed in Meta for the saved Phone Number ID.
- [ ] Meta phone number ID is correct.
- [ ] Access token is valid and stored only in protected settings or platform secrets.
- [ ] Webhook verify token matches Meta.
- [ ] Meta callback URL is `https://YOUR_DOMAIN/api/whatsapp/webhook`.
- [ ] Webhook GET verification succeeds with the correct verify token.
- [ ] Webhook GET verification fails with the wrong verify token.
- [ ] Webhook POST with a sample inbound message returns 200.
- [ ] App secret is configured before relying on signature validation.
- [ ] Test send succeeds only after provider success.
- [ ] Send Messages shows one of the safe states: `not_configured`, `validation_failed`, `provider_error`, or `sent_successfully`.
- [ ] WhatsApp Logs opens at `/whatsapp-logs`.
- [ ] Message Logs alias opens at `/message-logs`.
- [ ] Logs filters work for channel, direction, status, search, and limit.
- [ ] Message Logs CSV export respects workspace scope and safe fields only.
- [ ] Inbox groups WhatsApp and Messenger logs into business conversations without exposing raw webhook payloads or tokens.
- [ ] Inbox filters work for all channels, WhatsApp, Messenger, and search.
- [ ] Inbox reply with empty text shows `validation_failed`.
- [ ] Inbox reply with missing channel config shows `not_configured`.
- [ ] Inbox WhatsApp reply logs `OUTBOUND / SENT` only after Meta accepts the send.
- [ ] Inbox Messenger reply logs `OUTBOUND / SENT` only after Meta accepts the send.
- [ ] Inbox provider failures log `OUTBOUND / FAILED` with safe error text.
- [ ] Inbox failed replies keep the draft text so the user can retry.
- [ ] Inbox assignment helps team workflow while Message Logs remains the technical/debug view.
- [ ] Internal notes remain CRM-only and are never sent to WhatsApp or Messenger.
- [ ] Channel Center links to Settings, Send Messages, and Logs.
- [ ] Channel Center WhatsApp button opens `/send-messages`.
- [ ] Outbound send attempts appear in WhatsApp Logs with `SENT` or `FAILED` status.
- [ ] Inbound webhook messages appear in WhatsApp Logs with `RECEIVED` status.
- [ ] Recent webhook events appear without exposing access tokens or secrets.

Message log status meanings:

- `SENT`: provider accepted the outbound send.
- `FAILED`: provider rejected the send or the attempt failed.
- `RECEIVED`: inbound webhook message was received.
- `ATTEMPTED`: attempted-only state if used by a future workflow.

Live auto-reply test:

1. Create an active Auto Reply rule with keyword `price`.
2. Send a WhatsApp message containing `price` to the connected number.
3. Check `/whatsapp-logs`.
4. Expect inbound `RECEIVED`.
5. Expect outbound `SENT` or `FAILED`.

Connecting Welzz Stride real number `01958474577`:

- [ ] `WELZZ_STRIDE_NUMBER_CONNECTION_CHECKLIST.md` has been reviewed.
- [ ] Confirm whether `01958474577` is currently active in WhatsApp or WhatsApp Business app.
- [ ] If active, confirm whether it must be removed or disconnected before Cloud API registration.
- [ ] In Meta Developer Dashboard, go to WhatsApp, API Setup, and Add phone number.
- [ ] Add `+8801958474577`.
- [ ] Verify by SMS or voice.
- [ ] Copy the new Phone Number ID.
- [ ] Paste the new Phone Number ID into ARBCore Settings.
- [ ] Keep webhook URL as `https://arbcore-swiftconnect.vercel.app/api/whatsapp/webhook`.
- [ ] Test inbound from another number.
- [ ] Check `/whatsapp-logs` for `INBOUND - RECEIVED`.
- [ ] Create Auto Reply rule and test live reply.

## 10. Known Limitations

## 9A. Messenger Foundation QA

- [ ] `MESSENGER_SETUP_GUIDE.md` has been reviewed.
- [ ] Messenger / Page API Settings save and persist after refresh.
- [ ] Saved Page Access Token is not returned or displayed after refresh.
- [ ] Facebook Page ID is copied from the selected live Page.
- [ ] Page Access Token is generated for the selected live Page.
- [ ] Meta callback URL is `https://YOUR_DOMAIN/api/messenger/webhook`.
- [ ] Production callback URL is `https://arbcore-swiftconnect.vercel.app/api/messenger/webhook` unless a custom domain is used.
- [ ] Verify Token matches ARBCore exactly, for example `arbcore_messenger_verify_2026`.
- [ ] Messenger webhook GET verification succeeds with the correct verify token.
- [ ] Messenger webhook GET verification fails with the wrong verify token.
- [ ] Messenger webhook POST with a sample Page message returns 200.
- [ ] Messenger inbound messages appear in `/whatsapp-logs` with channel `MESSENGER`, direction `INBOUND`, and status `RECEIVED`.
- [ ] Messenger logs can be filtered by channel `MESSENGER`.
- [ ] Channel Center shows Messenger Page ID, Page Access Token, and Verify Token presence as Yes/No only.
- [ ] Channel Center Messenger test-send form explains PSID is required, not phone number.
- [ ] Channel Center Messenger test-send without config returns `not_configured`.
- [ ] `/api/messenger/test-send` without config returns `not_configured`.
- [ ] `/api/messenger/test-send` with config logs `SENT` only after Meta accepts the Send API request.
- [ ] Messenger provider errors log `FAILED` and show a safe provider error.
- [ ] Create Auto Reply rule with keyword `price`.
- [ ] Send Messenger message containing `price` to the connected Facebook Page.
- [ ] Confirm `/whatsapp-logs` shows `MESSENGER / INBOUND / RECEIVED`.
- [ ] Confirm `/whatsapp-logs` shows `MESSENGER / OUTBOUND / SENT` or `FAILED`.
- [ ] Inbox shows the Messenger conversation and reply composer explains PSID, not phone number.
- [ ] Inbox Messenger text reply logs `MESSENGER / OUTBOUND / SENT` only after Meta accepts.
- [ ] Replayed duplicate Messenger provider message ID does not send a second auto reply.

## 9B. WhatsApp Media Reply QA

- [ ] Text Inbox reply still sends and logs `WHATSAPP / OUTBOUND / SENT`.
- [ ] Inbox image reply with JPEG, PNG, or WebP up to 5 MB sends and logs `SENT`.
- [ ] Inbox PDF reply up to 10 MB sends and logs `SENT`.
- [ ] Unsupported file types are rejected before any provider call.
- [ ] Oversized images and PDFs are rejected before any provider call.
- [ ] Failed media upload or send attempts log `FAILED` with safe provider error details only.
- [ ] Message Logs show media summaries such as `[image]` or `[document]` and never show file binary or tokens.
- [ ] Video, audio, sticker, and bulk campaign media sending remain out of scope for this phase.

## 9C. WhatsApp Inbound Audio Playback QA

- [ ] Send WhatsApp voice/audio message to the connected business number.
- [ ] Inbox shows `[audio] Audio message` in the selected conversation.
- [ ] Inbox shows an audio player for inbound WhatsApp audio.
- [ ] Audio plays through `/api/whatsapp/media/[mediaId]` without exposing access token or raw Meta media URL.
- [ ] Message Logs show inbound media badge for audio logs.
- [ ] Text messages, WhatsApp text replies, and WhatsApp image/PDF outbound replies still work.
- [ ] Other inbound media playback/download remains out of scope for this phase.

## 9C-1. Unsupported WhatsApp Message Diagnostics QA

- [ ] Send or wait for a non-text Meta/WhatsApp event if available.
- [ ] Message Logs show safe body preview such as `[unsupported: system]` when Meta provides a type.
- [ ] Message Logs show provider message type and safe metadata summary only.
- [ ] Inbox shows "Unsupported WhatsApp message" as an informational note, not a crash or scary error.
- [ ] Support confirms Meta verification/security codes should be requested by SMS, phone call, email, or authenticator if WhatsApp Cloud API does not expose readable text.
- [ ] No raw webhook payload, access token, Authorization header, or provider secret is displayed.

## 9C-2. WhatsApp Profile And Ad Referral Context QA

- [ ] Inbound WhatsApp contact profile name is stored when Meta includes `contacts.profile.name`.
- [ ] Manual contact name is not overwritten by later WhatsApp profile name updates.
- [ ] Inbox and Contacts show WhatsApp profile name as a fallback/hint.
- [ ] Inbox explains that WhatsApp Cloud API does not provide customer profile photo and uses initials/avatar fallback.
- [ ] Click-to-WhatsApp referral context appears in Inbox, Contacts, Message Logs, and CSV exports when Meta includes referral data.
- [ ] No raw webhook payload, access token, Authorization header, or provider secret is displayed or exported.

## 9C-3. Conversation Quality QA

- [ ] New inbound WhatsApp or Messenger message marks the conversation unread.
- [ ] Mark read/unread works from selected Inbox conversation.
- [ ] Star/unstar works and the starred filter shows starred conversations.
- [ ] Priority can be set to Low, Normal, High, or Urgent.
- [ ] Quick label can be set to Hot Lead, Need Follow-up, Payment Pending, Order Issue, General, or blank.
- [ ] Filters work for unread/read, starred, priority, and quick label.
- [ ] Dashboard shows unread, urgent, high-priority, starred, hot-lead, and payment-pending conversation metrics.
- [ ] These internal CRM controls do not send messages automatically.

## 9C-4. Saved Replies / Quick Replies QA

- [ ] `/saved-replies` loads from the sidebar and mobile navigation.
- [ ] Suggested replies pre-fill the create form and do not auto-save.
- [ ] Create, edit, and archive saved reply works.
- [ ] Inbox loads active saved replies for the selected channel.
- [ ] Insert fills an empty composer.
- [ ] Append and Replace composer choices appear when the composer already has text.
- [ ] Saved replies do not auto-send; staff must click Send manually.
- [ ] Text/media reply, image/PDF attachment, and order prepared message flows still work.

## 9C-5. Staff Activity Logs QA

- [ ] `/activity-logs` loads from the sidebar for approved internal reviewers.
- [ ] Creating or updating contacts, orders, products, saved replies, auto-reply rules, and inbox state creates safe activity summaries.
- [ ] Activity Logs show actor, action, entity, summary, and time without exposing tokens, cookies, sessions, raw webhook payloads, or Authorization headers.
- [ ] Activity Logs CSV export is available from `/exports`.
- [ ] Logging failure does not block the original business action.

## 9C-6. Team Member Management QA

- [ ] Settings Team Members create form clearly shows name, email, role, and create action.
- [ ] Role dropdown requires Save Role before changes apply.
- [ ] Deactivate and Reactivate buttons are labeled and work without hard deleting users.
- [ ] Last active owner cannot be deactivated or demoted.
- [ ] Team member create, role update, deactivate, and reactivate actions appear in Activity Logs.

## 9C-7. Role-Based Staff Guidance QA

- [ ] Sidebar groups daily operations, channels/automation, review/insight, and admin/system areas.
- [ ] Topbar account menu shows role guidance for the current user.
- [ ] Settings Team Members explains Owner, Admin, Manager, and Agent responsibilities.
- [ ] Docs clearly state role guidance is UI/readiness only while enforcement flags remain off.
- [ ] No hard enforcement flags are enabled by this release.

## 9D. Mobile Browser QA

- [ ] `MOBILE_RESPONSIVENESS_QA_CHECKLIST.md` has been reviewed.
- [ ] Mobile width 390px: `/inbox` is usable with no full-page horizontal overflow.
- [ ] Mobile width 390px: `/message-logs` filters and log cards are readable.
- [ ] Mobile width 390px: `/contacts` search/filter controls and contact cards are readable.
- [ ] Mobile width 390px: `/settings` cards stack and token fields remain hidden after refresh.
- [ ] Mobile daily pages `/inbox`, `/message-logs`, `/contacts`, and `/send-messages` are recommended for operators.
- [ ] Desktop is still recommended for Meta setup, Settings token entry, Admin Workspaces, Provider Diagnostics, and Billing setup.

## 9E. Auto Reply Template Library QA

- [ ] `/auto-reply` loads and existing rules still display.
- [ ] Template Library appears with category filter and search.
- [ ] Use Template pre-fills keyword, match mode, reply message, priority, and active status.
- [ ] Template is not saved until the user reviews and clicks Save.
- [ ] Recommended first template rules are checked: `price`, `size`, `order`, `delivery`, `cod`, and `support`.
- [ ] Template Library Phase 1 remains text-only; media auto-replies are not shown as supported.
- [ ] Saving a template-based rule still triggers live WhatsApp/Messenger auto replies through existing webhook matching.

## 10. Known Limitations

- Billing/license enforcement is not active in beta.
- Manual payment tracking exists for paid beta clients, but gateway automation and billing enforcement are not active.
- Demo cookie auth remains in place until production auth is implemented.
- Supabase Auth helpers are preparation only; real login enforcement comes in a later phase.
- `AUTH_ENFORCED` defaults to false; set it to true only after a real admin Supabase user is tested.
- Use `AUTH_IMPLEMENTATION_PHASE_5.md` and `/auth/status` before enabling `AUTH_ENFORCED=true`.
- Use `AUTH_IMPLEMENTATION_PHASE_6.md` and `AUTH_ENFORCEMENT_TEST_CHECKLIST.md` for local/staging enforcement tests.
- Use `AUTH_IMPLEMENTATION_PHASE_7.md` and `/auth/permissions` before role permission blocking.
- Phase 8 guards selected APIs in report-only mode. Keep `PERMISSIONS_ENFORCED=false` until limited-role staging tests pass.
- Use `TENANT_MEMBERSHIP_ENFORCEMENT_PLAN.md` and `/auth/tenant-access` before tenant membership blocking. Keep `TENANT_MEMBERSHIP_ENFORCED=false` until staging tests pass.
- Phase 9 supports local/staging permission enforcement tests. Do not enable production permission enforcement automatically.
- Supabase Auth users must map to Prisma `User` records and the correct `companyId` before external client onboarding.
- Current beta is single-company/demo-auth mode; Phase 1 adds foundation only and real login enforcement comes later.
- Each external client must only see its own contacts, messages, settings, auto replies, and logs after real auth/company isolation is implemented.
- Meta webhook routes must remain public but verified.
- Real WhatsApp sending requires Meta Cloud API credentials and webhook readiness.
- Messenger Send API and live Messenger auto-reply require Meta Page setup and may require Meta permissions/app review for production.
- Payment gateway automation is planned but not active.
- Campaign sending requires approved templates and a completed production send workflow.
- Saved access tokens are intentionally hidden after refresh.

## 11. Rollback Notes

- [ ] Identify the last known good Git commit.
- [ ] Re-deploy the previous Vercel deployment or push a revert commit.
- [ ] Do not roll back database migrations without a tested migration rollback plan.
- [ ] Re-check `/api/health`, Settings, Contacts, Auto Reply, Send Messages, and Dashboard after rollback.
