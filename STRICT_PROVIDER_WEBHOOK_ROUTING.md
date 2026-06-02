# Strict Provider Webhook Routing

## Purpose

`STRICT_PROVIDER_WEBHOOK_ROUTING` prepares ARBCore SwiftConnect for safer multi-workspace webhook handling. It controls what happens when an inbound WhatsApp or Messenger webhook cannot be matched to a company by provider identifiers.

Default remains safe for Enterprise Beta:

```env
STRICT_PROVIDER_WEBHOOK_ROUTING=false
```

## Default Beta Behavior

When strict mode is false:

- WhatsApp webhooks try to match by Phone Number ID.
- Messenger webhooks try to match by Page ID.
- If no company is matched, ARBCore falls back to the beta/default workspace.
- This preserves existing Welzz Stride live behavior.

## Strict Mode Behavior

When strict mode is true:

- Matched provider webhooks are processed into the matched company.
- Unmatched provider webhooks are acknowledged with HTTP 200.
- Unmatched provider webhooks do not create customer `MessageLog` rows.
- Unmatched provider webhooks do not run Auto Reply.
- A safe `WebhookEvent` is stored with `UNMATCHED_PROVIDER` routing metadata only.
- No access tokens or secrets are stored or displayed.

## WhatsApp Routing

WhatsApp routing uses:

```text
entry[].changes[].value.metadata.phone_number_id
```

This value is matched against:

```text
Company.whatsappPhoneNumberId
```

WABA/business account ID may be extracted from `entry[].id` for diagnostics and future hardening, but the current company schema does not store a dedicated WABA field yet.

## Messenger Routing

Messenger routing uses:

```text
entry[].id
```

This value is matched against:

```text
Company.messengerPageId
```

Sender PSID is used for conversation/contact context, not company routing.

## Unmatched Provider IDs

If a provider ID is missing or does not match any company:

- `STRICT_PROVIDER_WEBHOOK_ROUTING=false`: fallback to beta/default workspace.
- `STRICT_PROVIDER_WEBHOOK_ROUTING=true`: acknowledge only, store safe unmatched event, and do not process customer messages.

## How To Test

### Strict False

1. Set `STRICT_PROVIDER_WEBHOOK_ROUTING=false`.
2. Send a webhook payload with an unknown WhatsApp Phone Number ID or Messenger Page ID.
3. Confirm current beta fallback behavior still works.
4. Confirm Message Logs and Auto Reply behave as before.

### Strict True Local/Staging

1. Set `STRICT_PROVIDER_WEBHOOK_ROUTING=true`.
2. Send an unmatched WhatsApp provider payload.
3. Confirm response is HTTP 200.
4. Confirm no customer MessageLog is created.
5. Confirm no Auto Reply is sent.
6. Confirm a safe `WebhookEvent` is stored with `UNMATCHED_PROVIDER`.
7. Repeat with an unmatched Messenger Page ID.

## Rollback

Set:

```env
STRICT_PROVIDER_WEBHOOK_ROUTING=false
```

Then redeploy or restart the app. This restores Enterprise Beta fallback behavior.

## Warning

Do not enable strict mode in production until every live workspace has the correct provider IDs saved:

- WhatsApp Phone Number ID
- Messenger Page ID

Strict mode is recommended only after workspace provider mapping is verified from Channel Center, Admin Workspaces, and live webhook tests.

Before enabling strict mode, also review `PROVIDER_ID_UNIQUENESS_PLAN.md` and confirm `/admin/provider-diagnostics` shows no duplicate provider IDs.
