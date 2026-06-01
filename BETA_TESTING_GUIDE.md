# ARBCore SwiftConnect Beta Testing Guide

## 1. Who Should Test

Start with business owners, sales/admin team members, customer support users, and trusted operators who regularly manage customer communication through WhatsApp.

Best initial tester profile:

- Understands daily customer communication
- Can test contacts and follow-up workflows
- Can give practical feedback
- Will not enter sensitive production credentials without approval

Suggested beta tester count: **start with 2-5 users**.

## 2. Test Account Preparation

Before testing:

1. Confirm the beta tester has access to the app URL.
2. Confirm the tester understands this is an Enterprise Beta.
3. Prepare sample customer names and phone numbers.
4. Avoid using real sensitive customer data unless approved.
5. Do not enter real WhatsApp access tokens unless the business has approved live API testing.
6. Explain that real WhatsApp sending requires WhatsApp Cloud API.
7. Use `META_WHATSAPP_SETUP_GUIDE.md` before any real end-to-end WhatsApp Cloud API test.

## 3. Test Flow Checklist

### Dashboard

- [ ] Open Dashboard.
- [ ] Confirm the page loads without visible errors.
- [ ] Check whether statistics are understandable.
- [ ] Confirm the dashboard gives a useful business overview.

### Settings: Business Profile

- [ ] Open Settings.
- [ ] Update Business name.
- [ ] Update Workspace name.
- [ ] Update phone, website, or timezone if needed.
- [ ] Click Save.
- [ ] Refresh and confirm values persist.

### Settings: WhatsApp/API Settings

- [ ] Open WhatsApp/API Settings.
- [ ] Enter safe test values only.
- [ ] Click Save.
- [ ] Refresh and confirm non-secret settings persist.
- [ ] Confirm access token is not displayed after refresh.

### Contacts Create/Edit/Delete

- [ ] Open Contacts.
- [ ] Create a contact with name and phone.
- [ ] Add optional email, tags, source, and status.
- [ ] Edit the contact.
- [ ] Search for the contact.
- [ ] Delete the test contact.

### Duplicate Contact Phone Test

- [ ] Create one test contact.
- [ ] Try creating another contact with the same phone number.
- [ ] Confirm a friendly duplicate phone message appears.
- [ ] Delete the test contact after the test.

### Auto Reply Create/Edit/Deactivate/Delete

- [ ] Open Auto Reply.
- [ ] Create a rule with a keyword and reply message.
- [ ] Edit the rule.
- [ ] Deactivate the rule and confirm the warning.
- [ ] Activate it again if needed.
- [ ] Delete the test rule.

### Live Auto Reply Test

- [ ] Confirm WhatsApp Cloud API settings are configured.
- [ ] Create an active rule with keyword `price`.
- [ ] Send a WhatsApp message containing `price` to the connected business number.
- [ ] Open `/whatsapp-logs`.
- [ ] Confirm the inbound message appears as `INBOUND - RECEIVED`.
- [ ] Confirm the auto reply appears as `OUTBOUND - SENT` if Meta accepts it.
- [ ] If Meta rejects the message, confirm the auto reply appears as `OUTBOUND - FAILED`.
- [ ] Confirm the app does not claim success unless Meta accepts the send.

### Send Messages Without WhatsApp API

- [ ] Open Send Messages.
- [ ] Enter a recipient phone number.
- [ ] Write or select a message.
- [ ] Click Send.
- [ ] Confirm the app says: `WhatsApp Cloud API is required to send real messages.`
- [ ] Confirm the app does not claim the message was sent.

### WhatsApp Cloud API Setup Test

- [ ] Review `META_WHATSAPP_SETUP_GUIDE.md`.
- [ ] Save the WhatsApp Phone Number ID in Settings.
- [ ] Save the WhatsApp Access Token in Settings.
- [ ] Save the Verify Token in Settings.
- [ ] Configure Meta webhook callback as `/api/whatsapp/webhook`.
- [ ] Confirm webhook verification succeeds with the correct verify token.
- [ ] Confirm webhook verification fails with a wrong token.
- [ ] Send one approved test message only after Meta setup is complete.
- [ ] Confirm Send Messages shows `sent_successfully` only when Meta accepts the request.
- [ ] Send one inbound WhatsApp message to the connected number.
- [ ] Confirm the webhook POST returns 200 and verify the message in UI logs, server logs, or the database.

### License Page

- [ ] Open License.
- [ ] Confirm it shows Enterprise Beta.
- [ ] Confirm it says billing/license enforcement is not active in beta.

## 4. Feedback Collection Questions

Ask each tester:

1. Was the UI clear?
2. Which feature was most useful?
3. Which part was confusing?
4. What should be added before real business use?
5. Would you use this for your business?
6. Was the WhatsApp sending limitation clear?
7. Did any error message feel technical or confusing?

## 5. Known Beta Limitations

- Full billing automation is not active.
- License enforcement is not active.
- Real WhatsApp sending requires WhatsApp Cloud API.
- The production webhook path is `/api/whatsapp/webhook`.
- Simple live auto replies are available for active keyword rules when WhatsApp Cloud API is configured.
- Live auto replies support simple active keyword rules; advanced routing is future-phase work.
- Advanced campaign scheduling is limited.
- Advanced analytics can be improved in a later phase.
- Production-grade enterprise auth and multi-workspace permissions are future-phase items.

## 6. Safety Notes

- Do not enter real sensitive tokens unless approved.
- WhatsApp Cloud API is required for real sending.
- Access tokens must be kept private.
- Do not share access tokens in screenshots, chat messages, public docs, or feedback forms.
- Use test contacts first.
- Do not promise message delivery unless the app confirms provider success.

## 7. Recommended Beta Process

1. Start with 2-5 testers.
2. Run one guided demo session.
3. Let testers use Contacts, Auto Reply, Settings, and Send Messages.
4. Collect feedback using the questions above.
5. Fix high-impact confusion or blockers.
6. Expand testing only after the first feedback cycle is stable.
