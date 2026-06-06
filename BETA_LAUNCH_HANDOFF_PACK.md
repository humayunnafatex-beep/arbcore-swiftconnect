# Beta Launch Handoff Pack

## Purpose

This pack gives owner, admin, manager, and agent users one practical launch-day guide for operating ARBCore SwiftConnect during Enterprise Beta.

It summarizes daily operations, live WhatsApp behavior, pending Messenger setup, staff role expectations, safety rules, and launch-day QA checks without exposing secrets.

## Production App

- Production app URL: `https://arbcore-swiftconnect.vercel.app`
- Dashboard: `https://arbcore-swiftconnect.vercel.app/dashboard`
- Inbox: `https://arbcore-swiftconnect.vercel.app/inbox`
- Follow-up Queue: `https://arbcore-swiftconnect.vercel.app/follow-ups`
- Message Logs: `https://arbcore-swiftconnect.vercel.app/message-logs`
- Settings: `https://arbcore-swiftconnect.vercel.app/settings`

## Current WhatsApp Connection

- Customer-facing Welzz Stride number: `01958474577`
- International format: `+8801958474577`
- Current known WhatsApp Phone Number ID from live setup/testing: `1117272714325369`
- WABA ID: confirm in Meta Business / WhatsApp Manager before any migration, handoff, or client expansion work.

ARBCore receives WhatsApp messages only for the number connected in Meta to the saved Phone Number ID. If customers message another WhatsApp number, ARBCore will not receive it.

Do not share or screenshot WhatsApp access tokens. Tokens are saved only when entered and are not displayed after refresh.

## Daily Operations Workflow

1. Open Dashboard and check operational health.
2. Open Channel Center and confirm WhatsApp is configured.
3. Review new WhatsApp messages in Inbox.
4. Link or create the customer contact.
5. Update contact status, tags, priority, read/unread, and assignment.
6. Create or update an order from Inbox.
7. Select a product if helpful for model, price, size helper, and image preview.
8. Manually send a product image only when needed.
9. Insert a Saved Reply for generic text or an Order Template for order-specific text.
10. Review the composer text and click Send Reply manually.
11. Confirm Message Logs show `OUTBOUND / SENT` or safe `FAILED` provider detail.
12. Set a follow-up date.
13. Open Follow-up Queue to review overdue, today, upcoming, and done items.
14. Mark follow-ups done or reopen/update them when needed.
15. Review Orders, Products, Contacts, Activity Logs, Message Logs, and Dashboard at day end.

## Staff Role Expectations

- `OWNER`: business owner, full control, Settings, Billing, provider setup, team, workspace, and final decisions.
- `ADMIN`: full operations/admin support, Settings support, team support, billing records, provider setup assistance.
- `MANAGER`: daily operations lead for Inbox, Contacts, Orders, Products, Saved Replies, Auto Reply, Follow-ups, Message Logs, Activity Logs, and Dashboard review.
- `AGENT`: customer handling through Inbox, Contacts, Orders, Products, Saved Replies, manual replies, and follow-up updates.

Role guidance is UI/readiness only in beta. Hard auth, permission, tenant membership, and strict provider routing enforcement remain off unless a future staging approval is completed.

## WhatsApp Messaging Rules

- ARBCore does not fake WhatsApp sending success.
- `SENT` is logged only after Meta accepts the provider request.
- Provider failures are logged as `FAILED` with safe error details.
- Use Inbox for manual conversation replies.
- Use Send Messages only for controlled WhatsApp send tests.
- Use Message Logs to verify inbound, outbound, failed, and attempted messages.
- Keep access tokens private.

## Product Image URL Limitation

Product images use public HTTPS image URLs only in this phase.

No file upload or storage system is active yet. Staff can preview product images and manually send a selected product image from Inbox for WhatsApp conversations. Product selection does not auto-send an image.

## Follow-up Queue Usage

Follow-up Queue at `/follow-ups` combines conversation and order follow-ups.

Use it each day to review:

- Overdue follow-ups
- Today’s follow-ups
- Upcoming follow-ups
- Completed follow-ups

Open Inbox or Order from the queue to continue the work with context. Mark Done, Reopen, and Update Date are internal actions only and do not send customer messages.

## Orders Workflow

Orders are manual customer order records linked to Contacts and Inbox conversations.

Orders can track:

- Product/model
- Size
- Quantity
- Amount and delivery charge
- Customer delivery details
- Payment status
- Order status
- Follow-up date and done state
- Internal notes

Saving an order does not send a WhatsApp or Messenger message.

## Saved Replies vs Order Templates

Saved Replies are generic reusable replies for common customer questions.

Order Templates are generated from a specific order, such as:

- Order confirmation
- Payment reminder
- Packed update
- Shipped update
- Delivered follow-up
- Cancelled notice

Both insert text into the Inbox composer only. Staff must review and click Send Reply manually.

## Auto Reply Safety

Auto Reply can respond to inbound messages when active rules match.

Safety rules:

- Keep rules simple and reviewed.
- Test keyword rules before relying on them.
- Check Auto Reply Analytics and Message Logs for `SENT` or `FAILED`.
- Do not use Auto Reply for sensitive promises, payment confirmation, or legal/financial commitments.

## Messenger Setup Status

Messenger Settings, webhook route, provider-backed test send, Inbox reply foundation, and live auto-reply foundation exist.

Live Messenger activation is still pending real Facebook Page setup:

- Facebook Page ID
- Page Access Token
- Messenger Verify Token
- Webhook callback URL
- `messages` subscription
- Manual inbound/outbound test

Use `MESSENGER_SETUP_GUIDE.md` and `MESSENGER_LIVE_QA_CHECKLIST.md`. Messenger uses Facebook PSID, not phone number. Page Access Tokens must never be displayed or shared.

## Logs Review

Message Logs:

- Verify WhatsApp/Messenger inbound and outbound activity.
- Filter by channel, direction, status, and search.
- Confirm provider errors safely.

Activity Logs:

- Review safe internal summaries of manual staff actions.
- Confirm contacts, orders, products, saved replies, team changes, and inbox state changes are tracked.
- Activity Logs must not contain tokens, raw webhook payloads, cookies, sessions, Authorization headers, or private DB URLs.

## Known Warnings And Limitations

- `DIRECT_URL` appears pooled in local production verification. This is documented as a migration-safety warning, not a runtime blocker. Resolve before production migration work.
- Messenger live Page setup/manual test is pending real Page ID and Page Access Token.
- Product image workflow is URL-only; no upload/storage infrastructure exists yet.
- Campaigns are draft/audience preview only; bulk sending is not active.
- Billing is manual; gateway automation and billing enforcement are not active.
- Auth/permission/tenant/strict routing enforcement flags remain off by default.
- Messenger contact linking still depends on PSID limitations.

## Do-Not-Do Safety Rules

- Do not reset the production database.
- Do not run destructive Prisma commands against production.
- Do not share tokens, private DB URLs, cookies, sessions, Authorization headers, or raw webhook payloads.
- Do not enable enforcement flags without a separate staging approval.
- Do not claim a customer message was sent unless logs show `SENT`.
- Do not auto-send product images, order updates, payment reminders, or follow-ups.
- Do not reuse Welzz Stride provider tokens in another client workspace.

## Basic Troubleshooting

### WhatsApp inbound not appearing

- Confirm customer messaged the connected WhatsApp API number.
- Check Channel Center.
- Check `/message-logs?channel=WHATSAPP`.
- Confirm Meta webhook URL and Verify Token.
- Confirm the saved Phone Number ID belongs to the active Meta number.

### WhatsApp reply failed

- Check Message Logs for safe provider error detail.
- Confirm Phone Number ID and Access Token are present in Settings/Channel Center.
- Confirm the recipient phone number is valid and allowed by Meta rules.

### Product image send failed

- Confirm the image URL is public HTTPS.
- Confirm the conversation is WhatsApp.
- Check Message Logs for safe provider error detail.

### Messenger not working

- Complete `MESSENGER_LIVE_QA_CHECKLIST.md`.
- Confirm Page ID and Page Access Token came from the same Facebook Page.
- Confirm recipient is a Page PSID, not a phone number.
- Confirm webhook subscription includes `messages`.

### Follow-up not visible

- Check whether the follow-up date is overdue, today, upcoming, or done.
- Clear filters in Follow-up Queue.
- Open the related conversation or order and confirm follow-up fields were saved.

## Beta Launch Day Checklist

- [ ] Dashboard loads.
- [ ] Channel Center shows WhatsApp configured.
- [ ] WhatsApp inbound message appears in Inbox.
- [ ] Mobile Inbox shows the conversation list first, opens the selected thread/composer after tap, and returns with Back to conversations.
- [ ] Contact create/link works.
- [ ] Contact status, tags, priority, and assignment can be updated.
- [ ] Manual outbound WhatsApp reply logs `OUTBOUND / SENT`.
- [ ] Failed provider response, if any, logs `OUTBOUND / FAILED` with safe detail.
- [ ] Order can be created from Inbox.
- [ ] Product can be selected and image preview appears when URL is present.
- [ ] Product image can be sent manually when appropriate.
- [ ] Saved Reply inserts into composer only.
- [ ] Order Template inserts into composer only.
- [ ] Mobile Inbox Saved Reply, Order Template, and Product Image actions remain reachable when available.
- [ ] Staff manually clicks Send Reply after review.
- [ ] Follow-up date can be set.
- [ ] Follow-up appears in `/follow-ups`.
- [ ] Follow-up can be marked done and reopened.
- [ ] Message Logs show inbound/outbound verification.
- [ ] Activity Logs show safe manual action summaries.
- [ ] Orders, Products, Contacts, and Dashboard remain readable.
- [ ] Messenger live test is completed only if Page ID and Page Access Token are ready.

## Related Documents

- `BETA_OPERATIONS_QA_CHECKLIST.md`
- `OPERATING_MANUAL.md`
- `SUPPORT_HANDOVER_NOTE.md`
- `LAUNCH_CHECKLIST.md`
- `META_WHATSAPP_SETUP_GUIDE.md`
- `WELZZ_STRIDE_NUMBER_CONNECTION_CHECKLIST.md`
- `MESSENGER_SETUP_GUIDE.md`
- `MESSENGER_LIVE_QA_CHECKLIST.md`
- `PRODUCTION_MIGRATION_SAFETY.md`
