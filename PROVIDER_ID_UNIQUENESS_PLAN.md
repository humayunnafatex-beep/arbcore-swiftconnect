# Provider ID Uniqueness Plan

## Purpose

Provider IDs must be unique before ARBCore SwiftConnect can safely run strict multi-client webhook routing. If two workspaces share the same provider identifier, inbound webhooks may route to the wrong company.

This plan covers readiness and diagnostics only. It does not add database unique constraints yet.

## Why Provider IDs Must Be Unique

Provider-based routing depends on stable identifiers:

- WhatsApp Phone Number ID routes WhatsApp inbound webhooks.
- Messenger Page ID routes Messenger inbound webhooks.

Each provider ID should belong to one company/workspace only. Duplicate IDs make strict routing unsafe.

## Current Safe Approach

Current Phase 6 behavior:

- Diagnostics only.
- Empty provider IDs are ignored.
- Provider IDs are masked in admin diagnostics.
- No access tokens are shown.
- No database unique constraints are added.
- `STRICT_PROVIDER_WEBHOOK_ROUTING=false` remains the default.

Use:

```text
/admin/provider-diagnostics
/api/admin/provider-diagnostics
```

## Why Not Add Unique Constraints Now

Immediate unique constraints are risky because:

- `Company.whatsappPhoneNumberId` defaults to an empty string.
- `Company.messengerPageId` defaults to an empty string.
- Multiple beta workspaces may have empty provider IDs.
- Existing beta data needs cleanup before constraints.
- PostgreSQL partial unique indexes need a deliberate migration plan.

## Future Migration Plan

1. Audit provider IDs with `/admin/provider-diagnostics`.
2. Resolve duplicate non-empty provider IDs.
3. Migrate empty strings to `NULL`.
4. Make provider fields nullable or move provider identifiers into a dedicated provider account table.
5. Add API validation to prevent duplicate non-empty IDs.
6. Add partial unique indexes if supported and tested:
   - unique non-empty WhatsApp Phone Number ID
   - unique non-empty Messenger Page ID
7. Enable strict provider webhook routing only after diagnostics are clean.

## Rollout Plan

1. Diagnose current provider IDs.
2. Clean duplicate or incorrect provider IDs.
3. Confirm each live workspace has the correct WhatsApp Phone Number ID and Messenger Page ID.
4. Add API validation for provider settings.
5. Add database constraints in a later migration.
6. Test `STRICT_PROVIDER_WEBHOOK_ROUTING=true` in local/staging.
7. Enable strict routing in production only after live webhook tests pass.

## Risks

- Duplicate WhatsApp Phone Number ID can route inbound WhatsApp messages to the wrong company.
- Duplicate Messenger Page ID can route inbound Page messages to the wrong company.
- Strict routing is unsafe until duplicates are cleaned.
- Empty IDs should not be treated as configured provider IDs.
- Wrong provider credentials can still cause outbound provider failures even if IDs are unique.

## Current Recommendation

Keep strict routing off by default:

```env
STRICT_PROVIDER_WEBHOOK_ROUTING=false
```

Before turning it on, confirm `/admin/provider-diagnostics` shows zero duplicate WhatsApp and Messenger provider IDs.
