# Supabase Admin User Mapping

Use this checklist to connect a Supabase Auth user to an existing ARBCore SwiftConnect Prisma `User` and `Company`.

## 1. Purpose

ARBCore SwiftConnect stores application users in the Prisma `User` table. Supabase Auth stores login identities in Supabase `auth.users`.

Phase 4 maps those two safely by storing the Supabase Auth user ID in:

```text
User.supabaseAuthId
```

The field is nullable, so existing Enterprise Beta/demo users continue working.

## 2. Create Supabase Auth User

1. Open Supabase Dashboard.
2. Go to Authentication.
3. Create a user for the ARBCore admin.
4. Use the same email as the existing ARBCore owner/team user.

Example current beta owner email:

```text
admin@arbcore.ai
```

Use the real production admin email before enabling auth enforcement.

## 3. Login Once Through ARBCore

1. Open `/login`.
2. Sign in with Supabase Auth using the same email.
3. ARBCore reads the Supabase session server-side.
4. ARBCore first looks for a Prisma user by `supabaseAuthId`.
5. If not found, ARBCore looks for a Prisma user by matching email.
6. If the email matches, ARBCore attaches the Supabase Auth user ID to that Prisma user.

## 4. Confirm Mapping In Database

Check the Prisma `User` row:

- `email` matches the Supabase Auth user email.
- `supabaseAuthId` is filled.
- `companyId` points to the correct company/workspace.
- `role` is correct, usually `OWNER` for the first admin.
- `isActive` is true.

## 5. Before Enabling Auth Enforcement

Do not set `AUTH_ENFORCED=true` until:

1. A real Supabase Auth admin user exists.
2. The matching Prisma `User` exists.
3. `supabaseAuthId` is attached.
4. The user can log in and reach Dashboard.
5. Settings, WhatsApp Logs, Send Messages, and Auto Reply still work.
6. Public webhook routes are still reachable.

## 6. Safety Notes

- Do not expose Supabase service-role keys.
- Do not expose WhatsApp access tokens.
- Do not auto-create unknown workspaces from random Supabase users yet.
- If mapping fails, keep `AUTH_ENFORCED=false`.
- If a wrong mapping is created, clear or correct `supabaseAuthId` in the database before enabling auth enforcement.
