# Mobile Responsiveness QA Checklist

## Purpose

Use this checklist to verify ARBCore SwiftConnect is usable from a mobile browser for daily operator work without changing provider, auth, billing, or admin behavior.

## Target Devices

- Android Chrome at 360px, 390px, and 430px widths.
- iPhone Safari at common small and large iPhone widths.
- Tablet browser around 768px width.

## Pages To Test

- Dashboard
- Inbox
- Message Logs
- Contacts
- Settings
- Auto Reply
- Send Messages

## Test Steps

1. Open each page on the target device or responsive browser width.
2. Confirm there is no full-page horizontal overflow.
3. Confirm primary buttons are visible and easy to tap.
4. Confirm filters, forms, and cards stack vertically on narrow screens.
5. Open `/inbox`, select a conversation, and confirm the conversation detail is readable.
6. Send a WhatsApp text reply from Inbox and confirm it logs `SENT` only after provider success.
7. Attach a supported image from Inbox and confirm the selected file name/size is visible.
8. Attach a supported PDF from Inbox and confirm the selected file name/size is visible.
9. Open `/message-logs` and confirm provider IDs and error messages wrap without pushing the page sideways.
10. Open `/contacts`, search/filter contacts, and confirm mobile contact cards are readable.
11. Open `/settings`, save a non-token field, and confirm access tokens are not displayed after refresh.
12. Confirm `/send-messages` remains usable for basic text tests.

## Known Limitations

- Advanced admin pages remain desktop-preferred.
- Meta setup, token generation, provider diagnostics, billing setup, and workspace administration should be done on desktop.
- Mobile browser support is intended for daily operations such as Inbox, Message Logs, Contacts, and basic message sending.
