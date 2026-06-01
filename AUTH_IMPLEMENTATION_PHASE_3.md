# Auth Implementation Phase 3

## 1. Purpose

Phase 3 adds controlled route protection readiness for ARBCore SwiftConnect. It introduces the `AUTH_ENFORCED` environment flag so protected app routes can be tested behind login without forcing auth on the current Enterprise Beta by default.

This phase is intentionally guarded. Default behavior remains current beta/demo access.

## 2. `AUTH_ENFORCED` Flag Behavior

Environment variable:

```text
AUTH_ENFORCED=false
```

Behavior:

- `false`: current Enterprise Beta/demo access remains available and app routes are not blocked.
- `true`: protected app routes redirect unauthenticated users to `/login`.
- Any value other than exactly `true` is treated as false.
- Webhook routes must remain public even when auth enforcement is true.

Do not enable this in production until a real admin Supabase user is created, tested, and mapped to the correct company.

For the user mapping step, use `AUTH_IMPLEMENTATION_PHASE_4.md` and `SUPABASE_ADMIN_USER_MAPPING.md`.

## 3. Protected Routes

Protected app routes when `AUTH_ENFORCED=true`:

```text
/
/dashboard
/contacts
/send-messages
/auto-reply
/whatsapp-logs
/settings
/license
```

Future protected API prefixes are documented in `lib/auth-routes.ts`, but this phase does not broadly change API behavior.

## 4. Public Routes

Public app routes:

```text
/login
/auth/callback
/auth/logout
```

Public provider API routes:

```text
/api/whatsapp/webhook
/api/webhooks/whatsapp
```

Future public provider route:

```text
/api/messenger/webhook
```

Provider webhook routes must remain reachable by Meta and must be protected by verify token/signature checks, not browser login.

## 5. Test With `AUTH_ENFORCED=false`

Default beta test:

1. Leave `AUTH_ENFORCED=false` or unset.
2. Open Dashboard.
3. Confirm Dashboard loads without forced login.
4. Confirm Settings loads and saves.
5. Confirm WhatsApp Logs loads.
6. Confirm Send Messages works.
7. Confirm Auto Reply works.
8. Confirm webhook routes build.

Expected result: current Enterprise Beta behavior remains unchanged.

## 6. Test With `AUTH_ENFORCED=true` Locally

Local enforcement test:

1. Set `AUTH_ENFORCED=true` in local environment.
2. Restart the dev/build server.
3. Open a protected route such as `/contacts`.
4. Confirm unauthenticated users redirect to `/login`.
5. Confirm `/login` loads.
6. Confirm `/auth/callback` and `/auth/logout` are not blocked.
7. Confirm `/api/whatsapp/webhook` is not blocked by middleware.
8. Confirm there is no redirect loop.

Only enable this in production after Supabase Auth users and company mapping are verified.

## 7. Rollback Instructions

If auth enforcement causes any issue:

1. Set `AUTH_ENFORCED=false`.
2. Redeploy.
3. Confirm Dashboard, Settings, WhatsApp Logs, Send Messages, Auto Reply, and webhook routes work again.

This rollback does not require database changes.

## 8. Warnings

- Do not enable in production until a real admin Supabase user is created and tested.
- Webhook routes must remain public.
- Demo fallback remains only for beta mode.
- Do not remove demo/default owner behavior until real auth and workspace isolation are complete.
- Do not expose Supabase keys beyond public anon browser keys.
- Do not expose WhatsApp access tokens or provider secrets.
