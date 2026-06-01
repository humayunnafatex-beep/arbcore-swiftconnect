# Auth Implementation Phase 9

## 1. Purpose

Phase 9 adds limited permission enforcement test support for local and staging.

It does not enable `AUTH_ENFORCED=true` or `PERMISSIONS_ENFORCED=true` by default. The goal is to make it safe to test real allow/deny behavior with mapped ARBCore roles before production enforcement.

## 2. Required Env For Local/Staging

Use these only in local or staging:

```text
AUTH_ENFORCED=true
PERMISSIONS_ENFORCED=true
```

Production Enterprise Beta should keep both flags off until the full checklist passes.

## 3. Preconditions

- Supabase admin user exists.
- `/auth/status` shows `supabase_mapped`.
- `/auth/permissions` shows the correct current role and permissions.
- Webhook routes are verified public:
  - `/api/whatsapp/webhook`
  - `/api/webhooks/whatsapp` if present
- No access tokens, cookies, raw sessions, or service-role keys are exposed.

## 4. Test Roles

- `OWNER`: full access to workspace, settings, team, billing, WhatsApp, and operational modules.
- `ADMIN`: nearly full access for workspace administration.
- `MANAGER`: business operations access, with limited settings/team/billing control.
- `AGENT`: contacts, messages, logs, and basic auto-reply view access.
- `VIEWER`: documented future role only. It is not in the current Prisma schema and should not be assigned until a future migration adds it.

## 5. What To Test

- Dashboard
- Contacts
- Send Messages
- Auto Reply
- WhatsApp Logs
- Settings
- Team
- License

## 6. Expected Allow/Deny Matrix

| Area | OWNER | ADMIN | MANAGER | AGENT | VIEWER |
| --- | --- | --- | --- | --- | --- |
| Dashboard | Allow | Allow | Allow | Allow | Allow |
| Contacts view | Allow | Allow | Allow | Allow | Allow |
| Contacts manage | Allow | Allow | Allow | Allow | Deny |
| Send Messages | Allow | Allow | Allow | Allow | Deny |
| WhatsApp Logs | Allow | Allow | Allow | Allow | Allow |
| Auto Reply view | Allow | Allow | Allow | Allow | Allow |
| Auto Reply manage | Allow | Allow | Allow | Deny | Deny |
| Settings view | Allow | Allow | Deny | Deny | Deny |
| Settings manage | Allow | Allow | Deny | Deny | Deny |
| Team view | Allow | Allow | Deny | Deny | Deny |
| Team manage | Allow | Allow | Deny | Deny | Deny |
| License view | Allow | Allow | Allow | Allow | Allow |
| Billing manage | Allow | Allow | Deny | Deny | Deny |

Note: existing Team APIs also keep their current `OWNER`/`ADMIN` role checks.

## 7. Newly Guarded In This Phase

Report-only guards were added to:

- `GET /api/settings/company`: `settings.view`
- `POST /api/settings/company`: `settings.manage`
- `GET /api/team`: `team.view`
- `POST /api/team`: `team.manage`

With `PERMISSIONS_ENFORCED=false`, these guards do not block current beta behavior.

## 8. Rollback

If permission enforcement blocks a valid staging workflow:

1. Set `PERMISSIONS_ENFORCED=false`.
2. Set `AUTH_ENFORCED=false` if login enforcement also needs rollback.
3. Redeploy or restart.
4. Confirm Dashboard, Settings, Team, WhatsApp Logs, Contacts, Auto Reply, and Send Messages work again.

## 9. Production Warning

Do not enable permission enforcement in production until local/staging tests pass for `OWNER`, `ADMIN`, `MANAGER`, and `AGENT`.

Webhook routes must remain public but verified. Do not protect provider webhook endpoints with user-role permission checks.
