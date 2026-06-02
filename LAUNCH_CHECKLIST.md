# ARBCore SwiftConnect Launch Checklist

Use this checklist before each production launch or rollback.

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
- [ ] `SESSION_SECRET` is long, random, private, and stored only in platform secrets.
- [ ] `NEXT_PUBLIC_APP_URL` matches the production domain.
- [ ] `OPENAI_API_KEY` is blank for beta fallback mode or set only in server secrets.
- [ ] `WHATSAPP_ACCESS_TOKEN` is set only when real WhatsApp sending is approved.
- [ ] `WHATSAPP_PHONE_NUMBER_ID` matches the Meta phone number.
- [ ] `WHATSAPP_VERIFY_TOKEN` matches the token configured in Meta webhooks, or the saved Settings verify token is used.
- [ ] `WHATSAPP_APP_SECRET` is set before trusting webhook signatures.
- [ ] `MESSENGER_VERIFY_TOKEN` is set only if using environment fallback for Messenger webhook verification.
- [ ] No real values are committed to Git.

## 2. Vercel Deployment

- [ ] Latest `main` commit is pushed.
- [ ] Vercel build is successful.
- [ ] Production deployment is Ready.
- [ ] `/api/health` returns success.
- [ ] Production domain uses HTTPS.

## 3. Supabase Migration

- [ ] Supabase project is healthy.
- [ ] Database backups are enabled.
- [ ] `npx prisma migrate deploy` has run for pending migrations.
- [ ] `npx prisma generate` has run after schema changes.
- [ ] Basic record counts look correct after deploy.

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
- [ ] Messenger conversation explains PSID contact-linking limitation without pretending it is linked.
- [ ] Inbox internal note saves and reloads.
- [ ] Internal note does not create a customer MessageLog entry.
- [ ] Inbox follow-up date saves and reloads.
- [ ] Inbox follow-up badges show Due, Upcoming, Done, or None correctly.
- [ ] Inbox follow-up filter works for All, None, Due, Upcoming, and Done.
- [ ] Clear follow-up removes the reminder and resets done state.
- [ ] Team duplicate email returns a friendly error.

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

## 5. Contacts QA

- [ ] Contact create works.
- [ ] Contact edit works.
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
- [ ] Replayed duplicate inbound provider message does not send a second auto reply.

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
- [ ] Meta callback URL is `https://YOUR_DOMAIN/api/messenger/webhook`.
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
- [ ] Replayed duplicate Messenger provider message ID does not send a second auto reply.

## 10. Known Limitations

- Billing/license enforcement is not active in beta.
- Demo cookie auth remains in place until production auth is implemented.
- Supabase Auth helpers are preparation only; real login enforcement comes in a later phase.
- `AUTH_ENFORCED` defaults to false; set it to true only after a real admin Supabase user is tested.
- Use `AUTH_IMPLEMENTATION_PHASE_5.md` and `/auth/status` before enabling `AUTH_ENFORCED=true`.
- Use `AUTH_IMPLEMENTATION_PHASE_6.md` and `AUTH_ENFORCEMENT_TEST_CHECKLIST.md` for local/staging enforcement tests.
- Use `AUTH_IMPLEMENTATION_PHASE_7.md` and `/auth/permissions` before role permission blocking.
- Phase 8 guards selected APIs in report-only mode. Keep `PERMISSIONS_ENFORCED=false` until limited-role staging tests pass.
- Phase 9 supports local/staging permission enforcement tests. Do not enable production permission enforcement automatically.
- Supabase Auth users must map to Prisma `User` records and the correct `companyId` before external client onboarding.
- Current beta is single-company/demo-auth mode; Phase 1 adds foundation only and real login enforcement comes later.
- Each external client must only see its own contacts, messages, settings, auto replies, and logs after real auth/company isolation is implemented.
- Meta webhook routes must remain public but verified.
- Real WhatsApp sending requires Meta Cloud API credentials and webhook readiness.
- Messenger Send API and live Messenger auto-reply require Meta Page setup and may require Meta permissions/app review for production.
- Payment/subscription automation is planned but not active.
- Campaign sending requires approved templates and a completed production send workflow.
- Saved access tokens are intentionally hidden after refresh.

## 11. Rollback Notes

- [ ] Identify the last known good Git commit.
- [ ] Re-deploy the previous Vercel deployment or push a revert commit.
- [ ] Do not roll back database migrations without a tested migration rollback plan.
- [ ] Re-check `/api/health`, Settings, Contacts, Auto Reply, Send Messages, and Dashboard after rollback.
