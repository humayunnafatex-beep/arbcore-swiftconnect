# Provider Webhook Routing Plan

## Purpose

This plan documents the provider-based webhook routing foundation for ARBCore SwiftConnect. The goal is to route inbound WhatsApp and Messenger webhook events to the correct company/workspace by provider identifiers while keeping the existing Enterprise Beta fallback behavior intact.

This phase does not enable full multi-client production enforcement.

## WhatsApp Routing

WhatsApp Cloud API webhooks include provider identifiers inside the webhook payload.

The routing helper extracts:

- `entry[].changes[].value.metadata.phone_number_id`
- `entry[].id` as a possible WhatsApp Business Account / WABA ID
- `messages[].from` as the customer sender phone

Current matching behavior:

- If `phone_number_id` is present, ARBCore looks for a company where `Company.whatsappPhoneNumberId` matches.
- If a match is found, inbound logs, webhook events, and auto replies use that company.
- WABA/business account ID is extracted for diagnostics and future hardening, but the current `Company` model does not yet store a WABA field.

## Messenger Routing

Messenger webhooks include the Facebook Page ID in the webhook payload.

The routing helper extracts:

- `entry[].id` as Facebook Page ID
- `messaging[].sender.id` as sender PSID

Current matching behavior:

- If Page ID is present, ARBCore looks for a company where `Company.messengerPageId` matches.
- If a match is found, inbound logs, webhook events, and auto replies use that company.

## Current Fallback

If provider-based lookup does not find a company, ARBCore falls back to the existing beta/default company behavior.

Fallback mode is marked as:

```text
BETA_FALLBACK
```

This preserves existing live webhook behavior for Welzz Stride and current Enterprise Beta testing.

## Production Requirement

Before untrusted multi-client production:

- Provider match should be required for inbound webhooks.
- Fallback routing should be disabled or converted into a safe unmatched-event quarantine.
- Each workspace must have unique provider identifiers.
- Admin/support should be alerted when a provider webhook cannot be matched.

## Test Checklist

1. Configure Workspace A with WhatsApp Phone Number ID A.
2. Configure Workspace B with WhatsApp Phone Number ID B.
3. Send inbound WhatsApp message to number A.
4. Confirm Message Logs show the event under Workspace A.
5. Send inbound WhatsApp message to number B.
6. Confirm Message Logs show the event under Workspace B.
7. Configure Workspace A with Messenger Page ID A.
8. Configure Workspace B with Messenger Page ID B.
9. Send Messenger message to Page A.
10. Confirm Message Logs show the event under Workspace A.
11. Send Messenger message to Page B.
12. Confirm Message Logs show the event under Workspace B.
13. Confirm webhook events include safe routing metadata only.
14. Confirm access tokens are not displayed or logged.

## Risks

- Duplicate provider IDs across companies.
- Missing provider ID in webhook payload.
- Wrong Phone Number ID or Page ID saved in Settings.
- Wrong provider credentials saved in a workspace.
- Beta fallback routing an unmatched webhook to the wrong workspace.
- Current global `Contact.phone` uniqueness can prevent creating the same customer/contact key in multiple workspaces.

## Future Hardening

- Add tenant-safe provider account models or unique indexes for non-empty provider IDs.
- Make `Company.whatsappPhoneNumberId` unique when non-empty.
- Make `Company.messengerPageId` unique when non-empty.
- Consider adding `Company.whatsappBusinessAccountId` or a channel account table.
- Remove beta/default fallback in production multi-client mode.
- Alert on unmatched provider webhook events.
- Keep webhook routes public for Meta callbacks but verified and provider-routed.

## Schema Note

Do not add unique constraints yet while provider ID defaults are empty strings. Empty-string defaults can make uniqueness migrations risky. Convert empty provider IDs to `NULL` or use a dedicated provider account model before enforcing uniqueness.
