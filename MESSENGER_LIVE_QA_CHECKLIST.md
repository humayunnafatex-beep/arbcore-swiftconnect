# Messenger Live QA Checklist

Use this checklist before activating Meta Messenger live testing for ARBCore SwiftConnect.

## Purpose

This checklist verifies Messenger Page setup, webhook verification, inbound receive, manual outbound reply, auto-reply behavior, and safe diagnostics without exposing Page Access Tokens or raw webhook payloads.

## Safety Rules

- Never share the Messenger Page Access Token.
- Never commit the Page Access Token.
- Do not screenshot tokens, cookies, sessions, Authorization headers, database URLs, or provider secrets.
- Do not paste raw webhook payloads into support tickets or public docs.
- Do not claim Messenger sending succeeded unless Message Logs show `MESSENGER / OUTBOUND / SENT`.
- Do not enable `AUTH_ENFORCED`, `PERMISSIONS_ENFORCED`, `TENANT_MEMBERSHIP_ENFORCED`, or `STRICT_PROVIDER_WEBHOOK_ROUTING` during this QA pass.

## Setup Values

- Facebook Page ID: copy from the selected live Facebook Page in Meta.
- Page Access Token: generate for the same Page and paste into ARBCore Settings.
- Messenger Verify Token: create a private string and use the exact same value in Meta and ARBCore.
- Callback URL:

```text
https://arbcore-swiftconnect.vercel.app/api/messenger/webhook
```

For a custom domain, keep the same path:

```text
https://YOUR_DOMAIN/api/messenger/webhook
```

## ARBCore Settings QA

- [ ] Open `/settings`.
- [ ] Enter the Facebook Page ID in Messenger / Page API Settings.
- [ ] Enter the Page Access Token only in the Page Access Token field.
- [ ] Enter the Messenger Verify Token.
- [ ] Enter the Messenger Webhook URL.
- [ ] Save Messenger settings.
- [ ] Refresh Settings and confirm the Page Access Token is not displayed in full.
- [ ] Confirm duplicate Messenger Page ID conflicts show a friendly error.

## Channel Center QA

- [ ] Open `/channels`.
- [ ] Messenger Page ID presence shows yes/no only.
- [ ] Page Access Token presence shows yes/no only.
- [ ] Verify Token presence shows yes/no only.
- [ ] Webhook URL/path copy helper contains no token.
- [ ] Messenger diagnostics show outbound readiness and webhook readiness.
- [ ] Missing setup items are field names only, not values.

## Meta Webhook Verification QA

- [ ] Open Meta Developer Dashboard.
- [ ] Open the Messenger product for the connected app.
- [ ] Configure callback URL:

```text
https://arbcore-swiftconnect.vercel.app/api/messenger/webhook
```

- [ ] Enter the same Verify Token saved in ARBCore Settings.
- [ ] Subscribe to `messages`.
- [ ] Save and verify.
- [ ] Confirm correct verify token succeeds.
- [ ] Confirm wrong verify token fails.

## Inbound Message QA

- [ ] From a personal Facebook account, send a message to the connected Page.
- [ ] Open `/message-logs`.
- [ ] Filter channel `MESSENGER`.
- [ ] Confirm `MESSENGER / INBOUND / RECEIVED`.
- [ ] Confirm webhook event summary is safe and does not expose raw payload or token.
- [ ] Open `/inbox`.
- [ ] Confirm the Messenger conversation appears.
- [ ] Confirm Messenger uses Facebook PSID, not phone number.

## Manual Outbound Reply QA

- [ ] Select the Messenger conversation in Inbox.
- [ ] Type a short reply.
- [ ] Send manually.
- [ ] Confirm Message Logs show `MESSENGER / OUTBOUND / SENT` only after Meta accepts.
- [ ] If failed, confirm Message Logs show `MESSENGER / OUTBOUND / FAILED` with safe provider error details.
- [ ] Confirm no Page Access Token appears in UI, logs, or provider diagnostics.

## Channel Center Test Send QA

- [ ] Obtain a valid Facebook Page PSID from a real inbound Page conversation.
- [ ] Open `/channels`.
- [ ] Enter the PSID in Messenger Test Send.
- [ ] Enter a short message.
- [ ] Send test manually.
- [ ] Confirm phone numbers are not accepted as Messenger recipients.
- [ ] Confirm `not_configured`, `validation_failed`, `provider_error`, or `sent_successfully` status is clear.
- [ ] Verify the final result in `/message-logs`.

## Auto Reply QA

- [ ] Create an active Auto Reply rule with keyword `price` and channel Messenger or both.
- [ ] Send a Messenger message containing `price` to the connected Page.
- [ ] Confirm inbound log is `MESSENGER / INBOUND / RECEIVED`.
- [ ] Confirm auto reply logs `MESSENGER / OUTBOUND / SENT` or `FAILED`.
- [ ] Confirm duplicate inbound provider message IDs do not trigger repeated auto replies.
- [ ] Confirm auto replies remain governed by existing Auto Reply rules only.

## Failure Diagnostics

When Messenger fails, check:

- Page Access Token present in Settings.
- Page ID matches the live Facebook Page.
- PSID came from a real conversation with that Page.
- Meta app has the required Messenger permissions.
- Webhook callback URL and Verify Token match exactly.
- `messages` webhook field is subscribed.
- Message Logs safe error details.
- Admin Provider Diagnostics for duplicate Messenger Page IDs.

## Final Decision

- Go: webhook verifies, inbound appears, manual reply succeeds or fails with safe provider detail, token remains hidden, and logs are safe.
- Needs Meta review: webhook works but send fails because of permissions or app review.
- Hold: Settings cannot save, token appears in UI/logs, inbound does not route, or Message Logs expose unsafe data.
