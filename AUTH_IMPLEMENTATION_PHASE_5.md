# Auth Implementation Phase 5

## 1. Purpose

Phase 5 adds a safe admin verification layer for checking whether a Supabase Auth user maps to the correct ARBCore SwiftConnect Prisma `User` and `Company`.

It does not enable global login enforcement. `AUTH_ENFORCED` must remain `false` in production until a mapped admin user is confirmed.

New verification tools:

- `/api/auth/me`: safe JSON status for Supabase Auth, Prisma user, company, and mode.
- `/auth/status`: admin-facing status page that reads `/api/auth/me`.

These tools never display access tokens, cookies, raw Supabase sessions, service-role keys, or WhatsApp credentials.

## 2. Prerequisites

- Supabase environment variables are configured in the deployment environment.
- The `User.supabaseAuthId` migration has been applied.
- The existing Prisma `User` email is known.
- A Supabase Auth user has been created with the same email as the existing ARBCore owner or team user.

## 3. Step-By-Step Verification

1. Open Supabase Dashboard.
2. Create a Supabase Auth user for the ARBCore admin.
3. Use the same email as the existing ARBCore owner or team user.
4. Open `/login`.
5. Sign in with the Supabase Auth user.
6. Open `/auth/status`.
7. Confirm `mode = supabase_mapped`.
8. Confirm Supabase user detected is `Yes`.
9. Confirm Prisma user mapped is `Yes`.
10. Confirm the Prisma role is correct, usually `OWNER` for the first admin.
11. Confirm the company name and plan are correct.
12. Confirm the Prisma `User` row has `supabaseAuthId` filled.
13. Keep `AUTH_ENFORCED=false` until all checks pass.

Expected modes:

- `supabase_mapped`: Supabase Auth user maps to a Prisma user and company.
- `beta_fallback`: no Supabase user is detected, auth is not enforced, and the beta fallback workspace is active.
- `unmapped`: Supabase Auth user exists but no matching Prisma user is mapped.
- `unauthenticated`: no Supabase user and no beta fallback is available.

## 4. Local Or Staging AUTH_ENFORCED Test

Use `AUTH_ENFORCED=true` only in local or staging after `/auth/status` confirms a mapped admin user.

1. Set `AUTH_ENFORCED=true` in local or staging only.
2. Restart the app or redeploy staging.
3. Log out.
4. Open a protected app route.
5. Confirm the app redirects to `/login`.
6. Log in with the mapped Supabase admin user.
7. Confirm Dashboard, Settings, WhatsApp Logs, Send Messages, and Auto Reply still work.
8. Confirm Meta WhatsApp webhook routes still build and remain public.

Do not enable this in production until the same flow has passed safely.

Phase 6 adds the dedicated local/staging enforcement test workflow. Use `AUTH_IMPLEMENTATION_PHASE_6.md` and `AUTH_ENFORCEMENT_TEST_CHECKLIST.md` before any `AUTH_ENFORCED=true` rollout.

## 5. Rollback

If auth mapping or enforcement testing causes an issue:

1. Set `AUTH_ENFORCED=false`.
2. Redeploy or restart the app.
3. Log out through `/auth/logout`.
4. Confirm beta fallback access works.
5. Clear or correct `User.supabaseAuthId` only if the wrong Supabase user was attached.

No WhatsApp token, webhook token, database credential, or service-role key change is required for this rollback.

## 6. Warning

WhatsApp webhook routes must stay public for Meta provider callbacks. Do not protect `/api/whatsapp/webhook` or related provider webhook endpoints with normal app login middleware.
