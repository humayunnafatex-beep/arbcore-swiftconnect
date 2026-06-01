# Messenger Setup Guide

Use this guide to prepare Meta Messenger/Facebook Page receive and reply support in ARBCore SwiftConnect.

Messenger support is provider-backed only after Meta setup is complete. ARBCore does not fake Messenger sending success.

## 1. Prerequisites

- Meta Developer App.
- Facebook Page owned or managed by the business.
- Messenger product added to the Meta App.
- Page Access Token.
- Webhook URL.
- Verify Token.
- Admin access to ARBCore SwiftConnect Settings.

Production use may require Meta permissions and app review.

## 2. ARBCore Settings Mapping

Open ARBCore Settings and use the Messenger / Page API Settings section:

- Page ID -> Facebook Page ID
- Page Access Token -> Page Access Token
- Verify Token -> Messenger Verify Token
- Webhook URL -> Messenger Webhook URL

Use Channel Center at `/channels` to confirm whether the Page ID, Page Access Token, Verify Token, and webhook URL are present. The Page Access Token is never displayed.

Channel Center also shows Messenger outbound readiness, webhook readiness, missing setup items, and a copy button for the webhook URL.

Use this webhook URL:

```text
https://arbcore-swiftconnect.vercel.app/api/messenger/webhook
```

For another production domain, replace the domain and keep the same path:

```text
https://YOUR_DOMAIN/api/messenger/webhook
```

## 3. Meta Webhook Setup

1. Open Meta Developer Dashboard.
2. Open the app connected to the Facebook Page.
3. Add or open the Messenger product.
4. Configure the webhook callback URL:

```text
https://arbcore-swiftconnect.vercel.app/api/messenger/webhook
```

5. Enter the same Verify Token saved in ARBCore Settings.
6. Subscribe to Messenger webhook events:
   - `messages`
   - `messaging_postbacks` if planned for a future phase
7. Save and verify the webhook.

## 4. First Inbound Test

1. Save Messenger / Page API Settings in ARBCore.
2. Send a message to the connected Facebook Page.
3. Open `/whatsapp-logs`.
4. Refresh logs.
5. Expected message log:
   - Channel: `MESSENGER`
   - Direction: `INBOUND`
   - Status: `RECEIVED`
6. Recent webhook events should show a Messenger event summary.
7. Channel Center links to Logs for this verification step.

The logs page supports filtering by channel `MESSENGER`, direction, status, and search. Messenger entries use Facebook PSID, not phone number. Use `/whatsapp-logs` or `/message-logs` for verification.

## 5. Real Send API Test

ARBCore includes:

```text
/api/messenger/test-send
```

Channel Center includes a Messenger Test Send form that calls this API. Use a Facebook Page PSID as the recipient. Do not enter phone numbers in the Messenger test form.

If Messenger settings are missing, it returns:

```json
{
  "success": false,
  "status": "not_configured",
  "error": "Messenger Page API is required to send real messages."
}
```

When Messenger settings are configured, ARBCore calls the Meta Messenger Send API. It logs `SENT` only after Meta accepts the request and logs `FAILED` when Meta rejects the request.

Inbox at `/inbox` can also reply from a selected Messenger conversation. Messenger replies require the Page Access Token and a valid Facebook PSID conversation. Do not use phone numbers for Messenger replies. After sending from Inbox, check `/message-logs` for `MESSENGER / OUTBOUND / SENT` or `MESSENGER / OUTBOUND / FAILED`.

Provider success state:

```json
{
  "success": true,
  "status": "sent_successfully",
  "data": { "providerMessageId": "..." }
}
```

Provider failure state:

```json
{
  "success": false,
  "status": "provider_error",
  "error": "Messenger provider rejected the message."
}
```

## 6. Live Messenger Auto-Reply Test

1. Confirm Messenger / Page API Settings are saved.
2. Create an active Auto Reply rule with keyword `price`.
3. Send a Messenger message containing `price` to the connected Facebook Page.
4. Open `/whatsapp-logs`.
5. Expected inbound log:
   - Channel: `MESSENGER`
   - Direction: `INBOUND`
   - Status: `RECEIVED`
6. Expected outbound auto-reply log:
   - Channel: `MESSENGER`
   - Direction: `OUTBOUND`
   - Status: `SENT` if Meta accepts the Send API request
   - Status: `FAILED` if Meta rejects the request or Page Access Token is missing

Duplicate inbound provider message IDs are skipped so the same Messenger message should not trigger repeated auto replies.

Manual Inbox replies use the same provider-backed safety rule as test sends and auto replies: ARBCore does not fake Messenger sending success.

## 7. Safety

- Never share the Page Access Token.
- Never commit the Page Access Token.
- Do not paste tokens into screenshots, tickets, public docs, or chat.
- Rotate the token if it is exposed.
- Do not log raw webhook payloads if they may contain customer data.
- Do not fake provider success.

## 8. Current Limitations

- Messenger inbound webhook logging is available.
- Messenger Send API is available for text messages when Meta settings are configured.
- Messenger live auto-reply is available for active keyword rules.
- Messenger logs appear in the existing logs viewer.
- Page permissions and Meta app review may be required for production use.
