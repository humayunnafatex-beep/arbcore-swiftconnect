# Welzz Stride Number Connection Checklist

Welzz Stride number: `01958474577`

International format: `+8801958474577`

## 1. Purpose

Use this checklist to connect Welzz Stride's real customer-facing WhatsApp number to ARBCore SwiftConnect.

ARBCore SwiftConnect can receive customer messages only from the WhatsApp number connected to Meta WhatsApp Cloud API through the saved Phone Number ID in ARBCore Settings. If customers message a different WhatsApp number, ARBCore will not receive those messages.

## 2. Before You Start

- [ ] Confirm ownership of `01958474577`.
- [ ] Confirm the SIM is active and can receive SMS or voice calls.
- [ ] Confirm whether `01958474577` is currently used in the WhatsApp app or WhatsApp Business app.
- [ ] If the number is already active in WhatsApp or WhatsApp Business app, confirm Meta's current requirements. It may need to be removed or disconnected before Cloud API registration.
- [ ] Confirm who will receive the SMS or voice OTP during setup.
- [ ] Confirm you have admin access to Meta Developer Dashboard and ARBCore SwiftConnect Settings.

## 3. Meta Setup Steps

- [ ] Go to Meta Developer Dashboard.
- [ ] Open the app that contains the WhatsApp product.
- [ ] Go to WhatsApp, then API Setup.
- [ ] Click Add phone number.
- [ ] Add `+8801958474577`.
- [ ] Verify the number by SMS or voice OTP.
- [ ] Select the new number in API Setup.
- [ ] Copy the new Phone Number ID.

## 4. ARBCore Settings Update

- [ ] Open `https://arbcore-swiftconnect.vercel.app/settings`.
- [ ] Paste the new Phone Number ID into WhatsApp Phone Number ID.
- [ ] Keep or update the WhatsApp Access Token safely.
- [ ] Keep the Webhook URL as:

```text
https://arbcore-swiftconnect.vercel.app/api/whatsapp/webhook
```

- [ ] Keep or update the WhatsApp Verify Token.
- [ ] Save settings.
- [ ] Refresh Settings.
- [ ] Confirm non-secret settings persist.
- [ ] Confirm the access token remains hidden after refresh.

## 5. Meta Webhook Check

- [ ] Go to WhatsApp, then Configuration.
- [ ] Confirm the callback URL is:

```text
https://arbcore-swiftconnect.vercel.app/api/whatsapp/webhook
```

- [ ] Confirm the Verify Token exactly matches ARBCore Settings.
- [ ] Confirm the `messages` field is subscribed.
- [ ] Save the webhook configuration if any change was made.

## 6. Live Inbound Test

- [ ] From another WhatsApp number, send a message to `01958474577`.
- [ ] Open `https://arbcore-swiftconnect.vercel.app/whatsapp-logs`.
- [ ] Refresh logs.
- [ ] Expected result: `INBOUND - RECEIVED`.

## 7. Live Auto-Reply Test

- [ ] Open Auto Reply.
- [ ] Create an active Auto Reply rule with keyword `price`.
- [ ] Send a message containing `price` to `01958474577`.
- [ ] Check `/whatsapp-logs`.
- [ ] Expected inbound result: `INBOUND - RECEIVED`.
- [ ] Expected outbound result: `OUTBOUND - SENT`.
- [ ] If Meta rejects the reply, expect `OUTBOUND - FAILED` with a safe error message.

## 8. Troubleshooting

### Number Already Registered On WhatsApp App

If `01958474577` is already active in WhatsApp or WhatsApp Business app, Meta may require it to be removed or disconnected before Cloud API registration. Confirm the impact before changing live customer communication.

### OTP Not Received

Confirm the SIM is active, has network coverage, and can receive SMS or voice calls. Try the alternate verification method if available.

### Wrong Phone Number ID

Make sure the Phone Number ID copied from Meta belongs to `+8801958474577`, not a previous test number.

### Access Token Expired

Temporary tokens can expire. Generate a fresh token or use the approved permanent token process when ready.

### Webhook Verify Token Mismatch

The Verify Token in Meta must exactly match the token saved in ARBCore Settings. Check spacing, capitalization, and extra characters.

### Messages Not Subscribed

Webhook verification can pass while inbound messages still do not appear. Confirm the `messages` field is subscribed in Meta webhook settings.

### App Test Mode Limitations

Meta test mode may restrict which recipients can receive outbound messages. Add approved test recipients or move to the approved business setup.

### Customer Sent Message To Wrong Number

ARBCore receives messages only for the number connected to the saved Phone Number ID. If a customer messages another WhatsApp number, ARBCore will not receive it.

### Auto Reply Rule Inactive

Confirm the Auto Reply rule is active before testing.

### Keyword Mismatch

Confirm the inbound message contains the rule keyword, such as `price`, and that the rule match mode is appropriate.

## 9. Safety Notes

- [ ] Never share the WhatsApp access token.
- [ ] Do not screenshot the access token.
- [ ] Rotate the token immediately if it is exposed.
- [ ] Do not claim `01958474577` is active in ARBCore until Meta verification is complete and the new Phone Number ID is saved.
- [ ] Keep the old Phone Number ID for rollback if needed.
- [ ] Do not commit tokens, OTPs, app secrets, or internal credentials.
