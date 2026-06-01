# Messenger Integration Plan

## 1. Purpose

This plan documents the future Meta Messenger/Facebook Page integration for ARBCore SwiftConnect. Messenger support should not be presented as active until a real Facebook Page, Meta App permissions, webhook verification, inbound logging, and provider-backed sending are working.

## 2. Required Meta Setup

Future setup will require:

- Facebook Page owned or managed by the business.
- Meta App with the Messenger product added.
- Page Access Token.
- Webhook URL.
- Verify Token.
- `messages` webhook subscription.
- Required Meta permissions and review for production use.

## 3. Future ARBCore Settings Fields

Recommended future fields:

- `messengerPageId`
- `messengerPageAccessToken`
- `messengerVerifyToken`
- `messengerWebhookUrl`

Safety expectation: the Page Access Token must be saved securely, masked after refresh, and never returned in normal API responses.

## 4. Future Routes

Recommended routes:

```text
/api/messenger/webhook
/api/messenger/test-send
/api/messenger/logs
```

`/api/messenger/logs` may be optional if the existing logs viewer becomes channel-aware.

## 5. Auto Reply Integration

Messenger auto replies should reuse the same rule engine direction as WhatsApp:

1. Receive Messenger webhook event.
2. Verify webhook request.
3. Parse inbound text message.
4. Log inbound message as Messenger channel.
5. Match active auto-reply rules for the company and channel.
6. Send reply through Messenger Send API.
7. Log `SENT` only after Messenger provider success.
8. Log `FAILED` if Messenger rejects the request.

Future Auto Reply should become channel-aware so a business can choose whether a rule applies to WhatsApp, Messenger, or all channels.

## 6. Safety

- Do not expose Page Access Token.
- Do not log Page Access Token.
- Do not fake Messenger success.
- Log `SENT` only after provider success.
- Log `FAILED` when the provider rejects or the app cannot send.
- Keep webhook verify tokens private.
- Validate inbound payloads before processing.
- Avoid duplicate replies by using Messenger provider message IDs.

## 7. Limitations

- Requires a Facebook Page connection.
- Requires Meta App setup with Messenger product.
- Requires webhook verification and `messages` subscription.
- Requires Meta permissions and possible app review for production.
- Should be implemented after WhatsApp beta stabilization and auth/workspace hardening.
