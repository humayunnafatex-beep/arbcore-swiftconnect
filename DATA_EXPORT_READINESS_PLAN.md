# Data Export Readiness Plan

## Purpose

This plan defines safe CSV export readiness for ARBCore SwiftConnect v1.1 Sprint 4.

Exports are intended for approved business operators and support/admin users who need workspace-scoped records for review, handover, reporting, or troubleshooting.

## Exportable Data In v1.1 Sprint 4

Sprint 4 supports CSV exports for:

- Contacts
- Message Logs
- Billing/Payment records
- Auto Reply Analytics

## Export Rules

- Exports must be scoped to the current company/workspace.
- CSV is the only export format in this phase.
- Export only safe fields.
- Do not export WhatsApp Access Tokens.
- Do not export Messenger Page Access Tokens.
- Do not export database URLs.
- Do not export cookies, sessions, or auth tokens.
- Do not export raw webhook payloads.
- Do not export service-role keys or provider secrets.
- Message bodies should use safe previews where practical.
- Billing exports are manual payment records only and must not contain card data.
- Auto Reply Analytics exports use safe previews only and must not contain raw provider responses.

## Current Export Routes

- `/exports`: user-facing export page.
- `/api/exports/contacts`: contacts CSV.
- `/api/exports/message-logs`: message logs CSV with optional filters.
- `/api/exports/billing`: manual billing/payment records CSV.
- `/api/exports/auto-reply-analytics`: auto reply event analytics CSV with optional channel and day-range filters.

## Future Exports

Possible future exports:

- Campaign drafts.
- Auto Reply rules.
- Inbox conversation states.
- Follow-up reminders.
- Support notes.

Future exports should follow the same company-scoped, safe-field-only rules.

## Security Cautions

- Exports may contain customer names, phone numbers, emails, message previews, payment notes, and internal business records.
- Share export files carefully.
- Do not upload export files to public links.
- Do not paste export contents into public chats.
- Delete local export copies when no longer needed.
- Confirm the selected workspace before exporting.

## Rollback

If export behavior needs to be disabled:

- Remove or hide `/exports` links.
- Disable the export API routes in a follow-up commit.
- No database rollback should be needed because Sprint 4 does not add schema changes.
- Re-run `npm.cmd run build` and `npm.cmd run verify:production`.
