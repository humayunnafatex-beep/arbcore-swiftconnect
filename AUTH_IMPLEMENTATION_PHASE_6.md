# Auth Implementation Phase 6

## 1. Purpose

Phase 6 prepares ARBCore SwiftConnect for safe `AUTH_ENFORCED=true` testing in local or staging.

This phase does not enable auth enforcement in production by default and does not force login for the current Enterprise Beta. The goal is to verify that Supabase Auth SSR cookie sessions can protect app routes while webhook routes remain public.

## 2. Preconditions

Before testing `AUTH_ENFORCED=true`:

- Supabase environment variables are configured.
- The `User.supabaseAuthId` migration has been applied.
- A Supabase Auth admin user has been created.
- The Supabase Auth user email matches an existing Prisma owner or team user.
- `/auth/status` shows `mode = supabase_mapped`.
- `/auth/status` shows a mapped Prisma user with role `OWNER` or `ADMIN`.
- The company exists and is the expected workspace.

## 3. Local Test Steps

1. Set `AUTH_ENFORCED=true` locally.
2. Start the app.
3. Visit `/dashboard` while logged out.
4. Confirm it redirects to `/login`.
5. Log in with the mapped Supabase Auth admin user.
6. Open `/auth/status`.
7. Confirm mode is `supabase_mapped`.
8. Visit protected routes:
   - `/dashboard`
   - `/contacts`
   - `/send-messages`
   - `/auto-reply`
   - `/whatsapp-logs`
   - `/settings`
   - `/license`
9. Log out through `/auth/logout`.
10. Visit `/dashboard` again.
11. Confirm protected routes redirect to `/login`.

## 4. Public Route Checks

These routes must remain available during enforced-mode testing:

- `/login` must load.
- `/auth/callback` must complete Supabase auth redirects.
- `/auth/logout` must work.
- `/api/whatsapp/webhook` must remain public for Meta.
- `/api/webhooks/whatsapp` must remain public if present.

Webhook routes must not require normal app login because Meta provider callbacks cannot use a user browser session.

## 5. Rollback

If enforced-mode testing fails:

1. Set `AUTH_ENFORCED=false`.
2. Restart locally or redeploy staging.
3. Confirm Dashboard loads again in default Enterprise Beta mode.
4. Confirm `/auth/status` returns either `supabase_mapped` after login or `beta_fallback` when logged out.

## 6. Production Warning

Do not enable `AUTH_ENFORCED=true` in production until the local or staging test passes completely.

Before production enforcement, also confirm:

- `/auth/status` shows a mapped admin user.
- `AUTH_ENFORCEMENT_TEST_CHECKLIST.md` is complete.
- `AUTH_IMPLEMENTATION_PHASE_7.md` and `/auth/permissions` have been reviewed before role permission blocking.
- WhatsApp webhook routes remain public and verified.
- No access tokens, cookies, raw sessions, or service-role keys are exposed.
