# Welzz Stride Internal Beta Runbook

## Purpose

This runbook is for using ARBCore SwiftConnect internally for Welzz Stride before paid client onboarding. It helps the team test daily operations, confirm safe channel behavior, collect feedback, and decide whether the app is ready for a controlled beta client.

This runbook does not replace the production launch checklist. Use it alongside `LAUNCH_CHECKLIST.md`, `PRODUCTION_DEPLOYMENT_VERIFICATION.md`, and `SUPABASE_PRODUCTION_MIGRATION_CHECKLIST.md`.

## Beta Duration

Suggested internal beta test duration: 2-3 days.

Use this period to test realistic workflows, not only page loading. Record confusing areas, failed messages, missing features, and any support concerns in `BETA_FEEDBACK_FORM.md`.

## Daily Test Flow

Run this flow once per test day:

1. Open Dashboard.
2. Check Channel Center.
3. Check Inbox.
4. Check Message Logs.
5. Check Contacts.
6. Check Auto Reply.
7. Check Campaign audience preview.
8. Check Billing if manual payment tracking is needed.

Daily pass criteria:

- Dashboard loads without visible errors.
- Channel Center shows safe channel status without tokens.
- Inbox conversations load and can be managed.
- Message Logs show recent inbound/outbound statuses safely.
- Contacts search/create/edit still works.
- Auto Reply rules are visible and editable.
- Campaign audience preview is clearly preview-only.
- Billing remains manual and does not claim gateway automation.

## WhatsApp Test Flow

1. Send an inbound WhatsApp message to the currently connected WhatsApp API number.
2. Open `/message-logs`.
3. Confirm the inbound message shows `INBOUND / RECEIVED`.
4. Open `/inbox`.
5. Select the conversation.
6. Reply from Inbox.
7. Confirm Message Logs show `OUTBOUND / SENT` if Meta accepts the message, or `OUTBOUND / FAILED` if the provider rejects it.
8. Create or confirm an active Auto Reply rule with keyword `price`.
9. Send a WhatsApp message containing `price`.
10. Confirm the inbound message is logged.
11. Confirm the auto reply is logged as `OUTBOUND / SENT` or `OUTBOUND / FAILED`.

Important:

- Do not treat a failed provider response as a successful send.
- Do not expose or screenshot access tokens.
- ARBCore receives messages only for the number connected to the saved Phone Number ID.

## Inbox CRM Workflow

For at least one real or test conversation:

1. Assign the conversation to a team member.
2. Set status to `OPEN`.
3. Set status to `PENDING`.
4. Set status to `CLOSED`.
5. Create or link a contact.
6. Add an internal note.
7. Add a follow-up reminder.
8. Mark the follow-up done.

Pass criteria:

- Assignment saves and reloads.
- Status saves and reloads.
- Contact linking or creation works.
- Internal notes remain internal and are not sent to the customer.
- Follow-up state is visible and can be completed.

## Campaign Draft Workflow

1. Open `/campaigns`.
2. Create a campaign draft.
3. Choose channel: WhatsApp or Messenger.
4. Add message body.
5. Add audience criteria:
   - Contact status
   - Tags
   - Search text
   - Audience channel preference
   - Optional audience limit
6. Save the draft.
7. Preview audience.
8. Confirm preview count and contact preview list are shown.
9. Confirm no Send or Broadcast button exists.

Important:

- Campaigns are draft planning only.
- Audience preview uses Contacts and does not send messages.
- Bulk campaign sending is disabled.
- Delivery/read metrics must not be faked.

## Billing Workflow

Use Billing only if manual beta payment tracking is needed.

1. Open `/billing`.
2. Review subscription plan and status.
3. Create a manual payment record if needed.
4. Use `PENDING` for unverified payments.
5. Use `CONFIRMED` only after offline/admin verification.
6. Open the receipt page from Payment History.
7. Confirm the receipt page works.

Payment meanings:

- `PENDING`: payment is recorded but not verified.
- `CONFIRMED`: admin has manually verified payment outside the app.
- `FAILED`: payment attempt or record failed.
- `REFUNDED`: payment was refunded manually.

Important:

- Gateway automation is not active.
- Do not store card data.
- Do not claim payment success unless the manual payment record is verified.

## Feedback Collection

Use `BETA_FEEDBACK_FORM.md` after each test day or tester session.

Track:

- Confusing areas
- Failed messages
- Missing features
- Slow or broken pages
- Wrong labels or unclear statuses
- Support questions that repeat
- Whether the workflow feels ready for a real business user

Recommended feedback questions:

- Which module was most useful?
- Which workflow was confusing?
- Did any message fail?
- Did Auto Reply behave correctly?
- Did Campaign audience preview make sense?
- Would Welzz Stride use this daily?
- What must be fixed before showing a paid beta client?

## Go/No-Go Decision

At the end of the 2-3 day internal beta, choose one:

### Ready For Beta Client

Choose this only if:

- Dashboard, Channel Center, Inbox, Contacts, Auto Reply, Message Logs, Campaigns, and Billing load consistently.
- WhatsApp test flow works or known provider issues are understood.
- No token or secret exposure occurred.
- Campaigns remain draft-only with no send confusion.
- Support team can explain the current beta limits.

### Needs Fixes

Choose this if:

- Any core workflow fails repeatedly.
- Testers are confused by statuses or navigation.
- Message Logs do not clearly explain provider outcomes.
- Inbox workflow does not save reliably.
- Campaign audience preview is unclear.

### Hold For WhatsApp Real Number Connection

Choose this if:

- Welzz Stride number `01958474577` is not yet connected to Meta Cloud API.
- The saved Phone Number ID does not represent the intended customer-facing number.
- Inbound testing cannot be completed on the real number.

Use `WELZZ_STRIDE_NUMBER_CONNECTION_CHECKLIST.md` before claiming the real number is active.
