# ARBCore SwiftConnect Client Onboarding Guide

## Purpose

Use this guide to onboard a business into ARBCore SwiftConnect in a controlled Enterprise Beta workflow. The goal is to confirm the business profile, channel setup, inbox workflow, logs, dashboard metrics, and token safety before real customer operations.

ARBCore SwiftConnect can receive customer messages only from channels connected through Meta Cloud API credentials saved in Settings. The app should never claim a disconnected WhatsApp number or Facebook Page is active.

## Who This Guide Is For

- Welzz Stride internal team
- Future beta clients
- Admin and support team members

## Onboarding Checklist

- [ ] Business Profile setup is complete.
- [ ] User and team setup is reviewed.
- [ ] WhatsApp setup is complete if WhatsApp testing is required.
- [ ] Messenger setup is complete if Messenger testing is required.
- [ ] Contacts are added or imported manually for now.
- [ ] Auto Reply rules are created and activated.
- [ ] Inbox workflow is tested with status, assignment, notes, and follow-up reminders.
- [ ] Message Logs verification is completed for inbound and outbound messages.
- [ ] Channel Center shows expected channel readiness.
- [ ] Dashboard shows expected CRM/support metrics.
- [ ] Security and token safety rules are reviewed.

## Step-By-Step Onboarding Flow

1. Open the production app:

```text
https://arbcore-swiftconnect.vercel.app
```

2. Open Settings and confirm the Business Profile.
3. Configure WhatsApp/API Settings only if WhatsApp Cloud API testing is required.
4. Configure Messenger/Page API Settings only if Messenger testing is required.
5. Add or import contacts manually for now.
6. Create Auto Reply rules for common keywords such as `price`, `delivery`, or `support`.
7. Test one inbound message from a real allowed test user.
8. Test one outbound reply from Inbox or Send Messages.
9. Open Message Logs and confirm the status is `RECEIVED`, `SENT`, or `FAILED`.
10. Use Inbox status, assignment, internal notes, and follow-up reminders for the test conversation.
11. Review Dashboard metrics and quick links.

## Welzz Stride-Specific Notes

- Business name: Welzz Stride
- Desired real WhatsApp number: `01958474577`
- International format: `+8801958474577`

This number becomes active in ARBCore only after Meta Cloud API verification is complete and the new Phone Number ID is saved in ARBCore Settings.

Do not claim `01958474577` is active unless Meta confirms the number and Channel Center/Message Logs prove inbound and outbound tests are working.

For the dedicated number setup workflow, use:

```text
WELZZ_STRIDE_NUMBER_CONNECTION_CHECKLIST.md
```

## Security Rules

- Never share WhatsApp access tokens or Messenger Page Access Tokens.
- Never screenshot tokens.
- Rotate any token that may have been exposed.
- Keep webhook verify tokens private.
- Webhook routes are public for Meta callbacks, but they must be verified.
- Do not reset the production database during onboarding.
- Do not enable `AUTH_ENFORCED=true` or `PERMISSIONS_ENFORCED=true` until the mapped admin and permission checklists pass.

## Go-Live Checklist

- [ ] Business Profile saves and persists.
- [ ] Channel Center shows expected configured channels.
- [ ] Meta webhook verification succeeds.
- [ ] Inbound message is received.
- [ ] Outbound message is sent only after provider success.
- [ ] Auto Reply is tested with a real inbound keyword.
- [ ] Inbox workflow is tested with status, assignment, internal notes, and follow-up.
- [ ] Message Logs show safe provider status.
- [ ] Dashboard metrics are checked.
- [ ] Access tokens remain hidden after refresh.
