# Meta WhatsApp Cloud API Setup Guide

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

## 4. Meta Webhook Setup

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

## 5. First Outbound Test

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

## 6. First Inbound Webhook Test

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

Inbound auto-reply sending is a future phase unless it has been explicitly enabled and tested.

## 7. Troubleshooting Common Meta Errors

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

## 8. Safety Notes

1. Never share the WhatsApp access token.
2. Never commit the access token to Git.
3. Do not paste the token into screenshots, tickets, demo scripts, or public documents.
4. Use a permanent token only when the business is ready for controlled live testing.
5. Rotate the token immediately if it is exposed.
6. Keep production credentials in protected settings or platform secrets.

## 9. Current Limitations

1. Auto-reply from inbound webhook messages is prepared as a TODO/future phase unless fully activated and tested.
2. Advanced campaign sending is not final.
3. Billing and license enforcement are beta only.
4. Multi-company webhook routing may need future hardening if multiple companies share one callback path.
5. Delivery and read-receipt UI may need additional refinement after live Meta testing.

## 10. Live Test Record

For every live test, record:

1. Test date and time.
2. Production domain used.
3. Meta app and phone number label, without tokens.
4. Outbound test result.
5. Inbound webhook result.
6. Any Meta error message, without secrets.
7. Whether Settings, Send Messages, WhatsApp Logs, and message logs behaved correctly.
