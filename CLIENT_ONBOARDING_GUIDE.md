# ARBCore SwiftConnect Client Onboarding Guide

## Purpose

Use this guide to onboard a business into ARBCore SwiftConnect in a controlled Enterprise Beta workflow. The goal is to confirm the business profile, channel setup, inbox workflow, logs, dashboard metrics, and token safety before real customer operations.

ARBCore SwiftConnect can receive customer messages only from channels connected through Meta Cloud API credentials saved in Settings. The app should never claim a disconnected WhatsApp number or Facebook Page is active.

Before paid client onboarding, run the Welzz Stride internal beta flow in `WELZZ_STRIDE_INTERNAL_BETA_RUNBOOK.md`.

For creating and tracking a separate client workspace record, review `CLIENT_WORKSPACE_ONBOARDING_PLAN.md` and use `/admin/workspaces` only as an admin-assisted beta tool.

For selected beta client access approval, user roles, workspace assignment, and offboarding, review `BETA_V1_ACCESS_CONTROL_PLAN.md`.

For Beta v1.0 release scope and handover, review `BETA_V1_RELEASE_SUMMARY.md`, `EXECUTIVE_HANDOVER_SUMMARY.md`, and `TECHNICAL_HANDOVER_INDEX.md`.

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
- [ ] Campaign drafts are prepared only if the client needs outreach planning.
- [ ] Campaign audience preview is reviewed only as planning data.
- [ ] Auto Reply rules are created and activated.
- [ ] Inbox workflow is tested with status, assignment, notes, and follow-up reminders.
- [ ] Message Logs verification is completed for inbound and outbound messages.
- [ ] Channel Center shows expected channel readiness.
- [ ] Dashboard shows expected CRM/support metrics.
- [ ] Security and token safety rules are reviewed.
- [ ] Billing is reviewed if this is a paid beta client.
- [ ] If this is an external client, a separate workspace is created and reviewed from `/admin/workspaces`.
- [ ] Supabase Auth to Prisma User to Company mapping is verified before promising client access.

## Step-By-Step Onboarding Flow

1. Open the production app:

```text
https://arbcore-swiftconnect.vercel.app
```

2. Open Settings and confirm the Business Profile.
3. Configure WhatsApp/API Settings only if WhatsApp Cloud API testing is required.
4. Configure Messenger/Page API Settings only if Messenger testing is required.
5. Add or import contacts manually for now.
6. Create campaign drafts and preview matching Contacts for future outreach planning if needed.
7. Create Auto Reply rules for common keywords such as `price`, `delivery`, or `support`.
8. Test one inbound message from a real allowed test user.
9. Test one outbound reply from Inbox or Send Messages.
10. Open Message Logs and confirm the status is `RECEIVED`, `SENT`, or `FAILED`.
11. Use Inbox status, assignment, internal notes, and follow-up reminders for the test conversation.
12. Review Dashboard metrics and quick links.

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
- Do not onboard paid clients until the client's workspace, owner user, auth mapping, and company scoping are verified.
- Do not reuse Welzz Stride WhatsApp or Messenger credentials for another workspace.
- Do not store card data or payment credentials.
- Do not mark a manual payment as `CONFIRMED` until an admin verifies it outside the app.
- Do not treat `PENDING` payment records as confirmed payments.
- Manual receipts can be printed from Billing payment history after a record is created.
- Plan limits are visible for beta planning but are report-only and do not block usage yet.
- Gateway automation is not active in this beta phase.
- Campaigns are draft planning only. Do not promise bulk sending, broadcast automation, or delivery metrics yet.
- Audience Preview is Contacts-based planning only and does not send messages.

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
- [ ] Manual billing status is checked for paid beta clients.
- [ ] Manual receipt is reviewed if a payment record was created.
- [ ] Plan usage is reviewed as report-only beta planning information.
- [ ] `/admin/workspaces` shows the correct workspace and owner user count for external client onboarding.
