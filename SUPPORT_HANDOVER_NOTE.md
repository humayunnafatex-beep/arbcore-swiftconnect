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

## Critical Docs

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
- `PRODUCTION_DEPLOYMENT_VERIFICATION.md`
- `PRODUCTION_MANUAL_QA_CHECKLIST.md`

## Common Support Tasks

- Check Channel Center for WhatsApp and Messenger setup readiness.
- Run or review `PRODUCTION_DEPLOYMENT_VERIFICATION.md` after a deployment.
- Use `PRODUCTION_MANUAL_QA_CHECKLIST.md` for manual route and workflow verification.
- Check Message Logs for `SENT`, `FAILED`, `RECEIVED`, or `ATTEMPTED`.
- Check Billing for manual subscription status and payment records when supporting paid beta clients.
- Use Billing Summary to review confirmed totals, pending totals, last payment, and period status.
- Use View Receipt from Payment History for printable manual receipts.
- Investigate a failed message by reviewing status, provider ID, safe error text, and channel settings.
- Confirm Auto Reply rule status, keyword, match mode, and channel configuration.
- Verify webhook callback URL and verify token match Meta settings.
- Confirm saved access tokens remain hidden after refresh.
- Use Inbox assignment and follow-up reminders to confirm who owns a conversation.

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

### Manual Payment Status Confusion

- Open Billing.
- Confirm the subscription status and latest manual payment record.
- Do not mark a payment `CONFIRMED` unless an admin has verified it offline.
- Do not treat `PENDING` payment records as confirmed payments.
- Use the manual receipt page only as a record of what was manually entered.
- Do not store card data or payment credentials.
- Gateway automation is not active yet.

## Safety Rules

- Do not share access tokens.
- Do not reset the production database.
- Do not enable `AUTH_ENFORCED=true` until a mapped admin is verified.
- Do not enable `PERMISSIONS_ENFORCED=true` until permission staging tests pass.
- Do not claim provider success unless Message Logs show `SENT`.
- Do not claim payment success unless the manual payment record has been verified by an admin.
- Do not expose raw webhook payloads if they may contain customer data.

## Escalation Checklist

- [ ] Check latest Vercel deployment status.
- [ ] Run the read-only production verification script if route health is uncertain.
- [ ] Check Supabase database health.
- [ ] Check Meta app and channel status.
- [ ] Check ARBCore Settings for channel fields.
- [ ] Check Channel Center diagnostics.
- [ ] Check Message Logs for affected time range.
- [ ] Check the latest commit and build result.
- [ ] Collect the user action, page, time, channel, and safe error text.
