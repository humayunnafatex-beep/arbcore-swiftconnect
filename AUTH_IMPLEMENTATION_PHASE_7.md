# Auth Implementation Phase 7

## 1. Purpose

Phase 7 prepares role-based permission checks for ARBCore SwiftConnect without globally enforcing them yet.

Supabase Auth handles identity and session cookies. ARBCore decides what a mapped application role can access. This phase adds a central permission map, a non-breaking API guard, a safe permission status endpoint, and an admin-facing permission status page.

## 2. Auth Enforcement vs Permission Enforcement

Auth enforcement answers:

- Is the user logged in?
- Should protected app pages redirect to `/login`?
- Controlled by `AUTH_ENFORCED`.

Permission enforcement answers:

- Is the logged-in user's ARBCore role allowed to perform this action?
- Should an API/page block unauthorized roles?
- Controlled by `PERMISSIONS_ENFORCED`.

Both flags default to `false` for Enterprise Beta safety.

## 3. `PERMISSIONS_ENFORCED` Flag

Add this environment variable when testing role blocking:

```text
PERMISSIONS_ENFORCED=false
```

Current behavior:

- `false`: permissions are documented and checkable, but beta users are not hard-blocked by the new guard.
- `true`: future API/page guards can block unauthorized roles.

Do not enable this in production until local or staging permission tests pass.

## 4. Role Definitions

Current Prisma roles:

- `OWNER`: full workspace control.
- `ADMIN`: operational admin access.
- `MANAGER`: manages day-to-day customer operations.
- `AGENT`: handles contacts, message activity, and follow-up.

Planned helper-only role:

- `VIEWER`: read-only future SaaS role.

`VIEWER` is not in the current Prisma schema. Do not assign it in Team until a future schema migration adds it.

## 5. Permission Matrix

| Permission | OWNER | ADMIN | MANAGER | AGENT | VIEWER |
| --- | --- | --- | --- | --- | --- |
| `dashboard.view` | Yes | Yes | Yes | Yes | Yes |
| `contacts.view` | Yes | Yes | Yes | Yes | Yes |
| `contacts.manage` | Yes | Yes | Yes | Yes | No |
| `messages.send` | Yes | Yes | Yes | Yes | No |
| `messages.viewLogs` | Yes | Yes | Yes | Yes | Yes |
| `autoReply.view` | Yes | Yes | Yes | Yes | Yes |
| `autoReply.manage` | Yes | Yes | Yes | No | No |
| `settings.view` | Yes | Yes | No | No | No |
| `settings.manage` | Yes | Yes | No | No | No |
| `team.view` | Yes | Yes | No | No | No |
| `team.manage` | Yes | Yes | No | No | No |
| `license.view` | Yes | Yes | Yes | Yes | Yes |
| `billing.manage` | Yes | Yes | No | No | No |
| `whatsapp.manage` | Yes | Yes | No | No | No |
| `messenger.manage` | Yes | Yes | No | No | No |

## 6. Protected Module Plan

Future guarded modules:

- Dashboard: `dashboard.view`
- Contacts: `contacts.view`, `contacts.manage`
- Send Messages: `messages.send`
- WhatsApp Logs: `messages.viewLogs`
- Auto Reply: `autoReply.view`, `autoReply.manage`
- Settings: `settings.view`, `settings.manage`, `whatsapp.manage`, `messenger.manage`
- Team: `team.view`, `team.manage`
- License/Billing: `license.view`, `billing.manage`

## 7. Future API Enforcement Plan

Use `lib/api-guard.ts` for future route-level checks.

Current non-breaking behavior:

- `requirePermission(permission)` loads the current auth context.
- It checks whether the user's role would have the requested permission.
- If `PERMISSIONS_ENFORCED=false`, it returns `allowed: true` and `wouldAllow` for audit/testing.
- If `PERMISSIONS_ENFORCED=true`, it throws a safe `FORBIDDEN` API error when the role lacks permission.

Do not apply this to every route until production auth and staging tests are ready.

## 8. Permission Status Tools

Use these tools for safe verification:

- `/api/auth/permissions`: safe JSON status with auth enforcement, permission enforcement, user email, role, and permission list.
- `/auth/permissions`: admin-facing page that displays the same information.

Neither tool returns tokens, cookies, raw Supabase sessions, service-role keys, or WhatsApp credentials.

## 9. Rollback

If permission enforcement causes a problem:

1. Set `PERMISSIONS_ENFORCED=false`.
2. Redeploy or restart.
3. Confirm `/auth/permissions` shows permissions enforcement off.
4. Confirm Dashboard, Settings, Send Messages, WhatsApp Logs, and Auto Reply still work.

## 10. Webhook Note

WhatsApp and Messenger webhook routes must remain public but verified. Do not protect provider webhook endpoints with app user-role permission checks.
