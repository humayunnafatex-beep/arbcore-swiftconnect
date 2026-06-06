# Beta Operations QA Checklist

Use this checklist during ARBCore SwiftConnect beta launch rehearsals and daily operations reviews. It follows the real staff workflow from inbound customer message to follow-up completion.

## Purpose

This checklist verifies the day-to-day beta workflow without adding automation or changing provider behavior. All customer messages remain manual unless an already configured Auto Reply rule responds to an inbound message.

## Safe Defaults

- `AUTH_ENFORCED=false`
- `PERMISSIONS_ENFORCED=false`
- `TENANT_MEMBERSHIP_ENFORCED=false`
- `STRICT_PROVIDER_WEBHOOK_ROUTING=false`
- Do not share or screenshot WhatsApp, Messenger, database, session, cookie, or provider token values.
- Do not claim a message was sent unless Message Logs show `OUTBOUND / SENT`.

## Daily Operations Flow

1. Open Dashboard and confirm the main metrics load.
2. Open Channel Center and confirm WhatsApp/Messenger setup status is understandable.
3. Receive a WhatsApp customer message and confirm it appears in Inbox.
4. Link an existing contact or create a contact from the Inbox conversation.
5. Update contact name, lead status, tags, priority, read/unread, or starred state as needed.
6. Create an order from Inbox.
7. Select a product in the order form and confirm model, price, size helper, and image preview behave as expected.
8. Manually send a product image only when needed and only after confirming it is a public HTTPS image URL.
9. Insert a Saved Reply for generic reusable text, or an Order Template for order-specific text.
10. Review the composer text and click Send Reply manually.
11. Confirm Message Logs show `OUTBOUND / SENT` or a safe `FAILED` provider error.
12. Set a follow-up date from Inbox or Orders.
13. Open Follow-up Queue and confirm the item appears under overdue, today, upcoming, or done.
14. Use Open Inbox or Open Order from the Follow-up Queue to continue the work with context.
15. Mark the follow-up done, reopen it if needed, or update the follow-up date.
16. Review Activity Logs for safe summaries of manual actions.

## Page Checks

### Dashboard

- [ ] Dashboard loads without blocking warnings.
- [ ] Follow-up and message health cards are understandable.
- [ ] Quick links open Inbox, Message Logs, Channel Center, Follow-up Queue, Orders, or Products as expected.

### Inbox

- [ ] New inbound WhatsApp conversations are visible.
- [ ] Mobile width: Inbox opens with the conversation list visible.
- [ ] Mobile width: tapping a conversation opens message history, reply composer, and Send Reply.
- [ ] Mobile width: Back to conversations returns to the list.
- [ ] Contact create/link/edit works from the selected conversation.
- [ ] Conversation priority, read/unread, starred, labels, assignment, notes, and follow-up controls are clear.
- [ ] Product selection previews product image when available.
- [ ] Send Product Image is manual only and does not trigger when a product is selected.
- [ ] Saved Replies insert generic text only.
- [ ] Order Templates insert order-specific text only.
- [ ] Mobile width: Saved Reply insert, Order Template insert, and Send Product Image remain reachable when available.
- [ ] Staff must click Send Reply manually.

### Follow-up Queue

- [ ] Overdue, today, upcoming, and done filters work.
- [ ] Conversation and order follow-ups are both shown.
- [ ] Open Inbox carries useful customer/order context when available.
- [ ] Mark Done, Reopen, and Update Date work without sending messages.

### Orders

- [ ] Orders can be created from Inbox.
- [ ] Order status, payment status, product/model, amount, delivery, and follow-up fields save and reload.
- [ ] Message Preview copies text only; it does not send a message.

### Products

- [ ] Product image URL helper text is clear.
- [ ] Valid public HTTPS image URLs preview.
- [ ] Empty or invalid image URLs do not break product save.

### Message Logs

- [ ] Inbound messages show `INBOUND / RECEIVED`.
- [ ] Successful manual replies show `OUTBOUND / SENT`.
- [ ] Provider failures show `OUTBOUND / FAILED` with safe error details only.

### Activity Logs

- [ ] Contact, order, product, saved reply, team, and inbox state changes appear as safe summaries.
- [ ] No tokens, raw webhook payloads, cookies, sessions, or Authorization headers appear.

## Go / No-Go Notes

- Go: daily workflow is understandable, manual sends are verified, logs are safe, and follow-ups are easy to complete.
- Needs polish: staff can complete the flow but labels, helper text, or navigation still cause confusion.
- Hold: Inbox, Message Logs, Settings, provider sends, or follow-up queue fails in a way that blocks daily support.
