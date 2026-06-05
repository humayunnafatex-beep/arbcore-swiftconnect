# Meta WhatsApp Cloud API Setup Guide

For multi-workspace routing behavior, also review `PROVIDER_WEBHOOK_ROUTING_PLAN.md`. WhatsApp inbound webhooks can be routed by `metadata.phone_number_id` when it matches `Company.whatsappPhoneNumberId`; unmatched events still use beta fallback behavior.

Use this guide to connect ARBCore SwiftConnect to the real Meta WhatsApp Cloud API for live end-to-end testing.

ARBCore SwiftConnect does not fake WhatsApp sending. A message is only treated as sent when Meta accepts the request through WhatsApp Cloud API.

## 1. Prerequisites

Before starting, prepare:

1. A Meta Business account.
2. A Meta Developer App.
3. The WhatsApp product added to the Meta Developer App.
4. A test WhatsApp phone number or approved business WhatsApp phone number.
5. The production Vercel URL for ARBCore SwiftConnect.
6. Admin access to ARBCore SwiftConnect Settings.

## 2. Required Values

You need these values from Meta and ARBCore:

### Phone Number ID

Find this in the Meta Developer dashboard under the WhatsApp product setup or API setup section. It is not the display phone number. It is the Meta-generated phone number ID used in API requests.

### WhatsApp Access Token

Find this in the Meta Developer dashboard under WhatsApp API setup. For early testing, Meta may provide a temporary token. For longer live testing, use a permanent token only when the business is ready and access is controlled.

Keep this token private. Never commit it, share it in screenshots, or paste it into public documents.

### Verify Token

Create your own private verify token. It can be any secure text value you choose. The exact same value must be saved in ARBCore Settings and entered in Meta webhook setup.

### Webhook Callback URL

Use the production webhook endpoint:

```text
https://YOUR-PRODUCTION-DOMAIN/api/whatsapp/webhook
```

For the current Vercel production app, use:

```text
https://arbcore-swiftconnect.vercel.app/api/whatsapp/webhook
```

### Webhook Fields And Subscriptions

In Meta webhook settings, subscribe the WhatsApp product to webhook events, especially:

```text
messages
```

Other delivery, status, and account events may be added later as the production workflow expands.

## 3. ARBCore Settings Mapping

Open ARBCore SwiftConnect, go to Settings, then open WhatsApp/API Settings.

Paste the values like this:

| Meta Value | ARBCore Settings Field |
| --- | --- |
| Phone Number ID | WhatsApp Phone Number ID |
| Access Token | WhatsApp Access Token |
| Verify Token | WhatsApp Verify Token |
| Callback URL | WhatsApp Webhook URL |

The webhook URL should be:

```text
https://YOUR-PRODUCTION-DOMAIN/api/whatsapp/webhook
```

After saving, refresh Settings and confirm the non-secret fields persist. The access token should stay hidden after refresh.

After saving, open `/channels` to confirm the WhatsApp Phone Number ID, Access Token, Verify Token, and webhook URL show as present. Channel Center never displays the access token.

Channel Center also shows WhatsApp outbound readiness, webhook readiness, missing setup items, and a copy button for the webhook URL.

## 4. Connecting Welzz Stride Real Number 01958474577

Customers should eventually message Welzz Stride on `01958474577`, but ARBCore can only receive messages for a number that is connected in Meta WhatsApp Cloud API and whose Phone Number ID is saved in ARBCore Settings.

For the dedicated operational checklist, use `WELZZ_STRIDE_NUMBER_CONNECTION_CHECKLIST.md`.

Follow this safe connection flow:

1. Confirm whether `01958474577` is currently active in the WhatsApp or WhatsApp Business app.
2. If it is active in the app, it may need to be removed or disconnected before Cloud API registration. Confirm Meta's current requirements before changing live customer communication.
3. In Meta Developer Dashboard, open WhatsApp, then API Setup, then Add phone number.
4. Add the number as `+8801958474577`.
5. Verify the number by SMS or voice.
6. Copy the new Meta Phone Number ID.
7. Paste the new Phone Number ID into ARBCore Settings under WhatsApp Phone Number ID.
8. Keep the webhook URL the same:

```text
https://arbcore-swiftconnect.vercel.app/api/whatsapp/webhook
```

9. Save WhatsApp/API Settings in ARBCore.
10. Test inbound by sending a WhatsApp message from another number to `01958474577`.
11. Check `/whatsapp-logs` for `INBOUND - RECEIVED`.
12. Create an active Auto Reply rule and test a live reply.

Do not assume `01958474577` is active in ARBCore until Meta shows it as connected and the new Phone Number ID is saved in ARBCore Settings.

## 5. Meta Webhook Setup

In the Meta Developer dashboard:

1. Open the app that contains the WhatsApp product.
2. Go to WhatsApp webhook configuration.
3. Set the Callback URL to:

```text
https://arbcore-swiftconnect.vercel.app/api/whatsapp/webhook
```

Or use the business's own production domain:

```text
https://YOUR-PRODUCTION-DOMAIN/api/whatsapp/webhook
```

4. Enter the Verify Token exactly as saved in ARBCore Settings.
5. Save and verify the callback.
6. Subscribe to WhatsApp webhook events, especially `messages`.
7. Save the webhook subscription.

If the verify token has even one different character, Meta verification will fail.

## 6. First Outbound Test

Use a controlled test contact first.

1. Open ARBCore Settings.
2. Save the WhatsApp Phone Number ID.
3. Save the WhatsApp Access Token.
4. Save the WhatsApp Verify Token.
5. Go to Send Messages.
6. Enter the recipient phone number in international format, such as `8801XXXXXXXXX`.
7. Enter a simple test message.
8. Click Send.
9. Open WhatsApp Logs and confirm the outbound attempt appears in Recent WhatsApp Message Logs.

Expected success state:

```text
sent_successfully
```

Expected failure states:

```text
not_configured
validation_failed
provider_error
```

Use Channel Center to jump to Send Messages and Logs during this test.

WhatsApp test sending remains in `/send-messages`; Channel Center only links to it.

The logs page supports filtering by channel `WHATSAPP`, direction, status, and search. Use `/whatsapp-logs` or `/message-logs` for verification.

Inbox at `/inbox` can also reply from a selected WhatsApp conversation. The selected conversation must have a valid customer phone number, and WhatsApp Cloud API settings must be configured. ARBCore logs `SENT` only after Meta accepts the reply and logs `FAILED` if Meta rejects it. Check `/message-logs` after each Inbox reply.

Failure state meanings:

| Status | Meaning |
| --- | --- |
| `not_configured` | WhatsApp Cloud API settings are missing or incomplete. |
| `validation_failed` | The phone number or message is invalid or missing. |
| `provider_error` | Meta rejected the request or returned an API error. |
| `sent_successfully` | Meta accepted the message through WhatsApp Cloud API. |

Message log statuses may include:

| Status | Meaning |
| --- | --- |
| `SENT` | The outbound message was accepted for sending. |
| `FAILED` | The outbound message attempt failed. |
| `RECEIVED` | An inbound WhatsApp message was received through the webhook. |
| `ATTEMPTED` | A send was attempted if the workflow records attempted-only states in a future phase. |

## 7. First Inbound Webhook Test

After webhook verification succeeds:

1. Send a WhatsApp message to the connected business or test number.
2. Confirm Meta sends a webhook POST request to:

```text
/api/whatsapp/webhook
```

3. Confirm the webhook POST returns HTTP 200.
4. Open WhatsApp Logs.
5. Confirm the inbound message appears in Recent WhatsApp Message Logs with `RECEIVED` status.
6. Confirm the webhook appears in Recent Webhook Events.
7. If the UI does not show the expected record, verify it in the database or server logs.

Simple live keyword auto replies are enabled when WhatsApp Cloud API settings are configured and an active rule matches the inbound text.

## 8. First Live Auto Reply Test

After outbound and inbound tests pass:

1. Open Auto Reply.
2. Create an active rule with keyword:

```text
price
```

3. Use a simple reply message, such as:

```text
Thanks for your interest. Our team will share the latest price details shortly.
```

4. Send a WhatsApp message containing `price` to the connected business or test number.
5. Open WhatsApp Logs.
6. Confirm the inbound message appears as `INBOUND - RECEIVED`.
7. Confirm the auto reply appears as `OUTBOUND - SENT` if Meta accepts it.
8. If Meta rejects the auto reply, confirm it appears as `OUTBOUND - FAILED` with a safe error message.

ARBCore SwiftConnect does not fake auto-reply success. Auto replies are logged as `SENT` only when Meta API returns success.

Manual Inbox replies follow the same rule: success is never faked, and `/message-logs` should show `OUTBOUND - SENT` or `OUTBOUND - FAILED`.

## 9. Troubleshooting Common Meta Errors

### Invalid OAuth Access Token

The access token may be expired, copied incorrectly, or missing the required WhatsApp permissions. Generate or refresh the token in Meta and save it again in ARBCore Settings.

### Phone Number ID Wrong

Make sure you copied the Phone Number ID, not the visible WhatsApp display number.

### Recipient Not Allowed In Test Mode

Meta test mode only allows approved test recipients. Add the recipient in the Meta test recipient list or use an approved business setup.

### Webhook Verification Failed

Check that the callback URL is public, uses HTTPS, points to production, and ends with:

```text
/api/whatsapp/webhook
```

### Verify Token Mismatch

The verify token in Meta must exactly match the token saved in ARBCore Settings. Check spacing, capitalization, and extra characters.

### Missing Messages Subscription

Webhook verification can pass while message events still do not arrive. Confirm the WhatsApp product is subscribed to the `messages` field.

### Token Expired

Temporary Meta tokens expire. Use a fresh temporary token for testing or set up a permanent token when ready.

### Message Template Required

Outside the 24-hour customer service window, WhatsApp may require an approved message template. Free-form text messages may be rejected until the customer has recently messaged the business.

### Unsupported Or System Message Type

Meta may deliver system, security, verification, interactive, button, reaction, contact, location, order, sticker, or unknown WhatsApp events that do not contain a normal readable customer text body. ARBCore logs these as safe diagnostics such as `[unsupported: system]`, with message type and short metadata summary only.

Do not rely on WhatsApp Cloud API to read every Meta verification/security code. If a code is not visible as a normal text message, request it through SMS, phone call, email, or an authenticator option. Never share or screenshot access tokens, Authorization headers, raw webhook payloads, or provider secrets.

## 9A. Media Reply Test From Inbox

WhatsApp Media Send Phase 1 supports media replies from the Inbox after the customer conversation exists.

Test flow:

1. Confirm text Inbox reply sends successfully first.
2. Open `/inbox` and select a WhatsApp conversation.
3. Attach a JPEG, PNG, or WebP image up to 5 MB, optionally add a caption, and send.
4. Attach a PDF up to 10 MB, optionally add a caption, and send.
5. Open `/message-logs` and confirm the media reply logs `WHATSAPP / OUTBOUND / SENT`.
6. If Meta rejects upload or send, confirm the log shows `FAILED` with safe provider error details only.

ARBCore uploads media to Meta first and then sends a WhatsApp message using the returned media ID. Video, audio, stickers, and campaign media sending are not part of Phase 1. Do not upload sensitive customer documents unless the business has approved that workflow.

## 10. Safety Notes

1. Never share the WhatsApp access token.
2. Never commit the access token to Git.
3. Do not paste the token into screenshots, tickets, demo scripts, or public documents.
4. Use a permanent token only when the business is ready for controlled live testing.
5. Rotate the token immediately if it is exposed.
6. Keep production credentials in protected settings or platform secrets.
7. Test auto replies with a small controlled group before using live customer traffic.

## 11. Current Limitations

1. Auto-reply from inbound webhook messages supports simple active keyword rules. More advanced routing and template logic can be added in a future phase.
2. Advanced campaign sending is not final.
3. Billing and license enforcement are beta only.
4. Multi-company webhook routing may need future hardening if multiple companies share one callback path.
5. Delivery and read-receipt UI may need additional refinement after live Meta testing.

## 12. Live Test Record

For every live test, record:

1. Test date and time.
2. Production domain used.
3. Meta app and phone number label, without tokens.
4. Outbound test result.
5. Inbound webhook result.
6. Auto Reply rule keyword used and result.
7. Any Meta error message, without secrets.
8. Whether Settings, Send Messages, Auto Reply, WhatsApp Logs, and message logs behaved correctly.
