# Auth Implementation Phase 4

## 1. Purpose

Phase 4 prepares safe mapping between Supabase Auth identities and ARBCore SwiftConnect application users.

Supabase Auth stores login identities in `auth.users`. ARBCore stores application users, roles, and workspace access in the Prisma `User` and `Company` models. This phase links them without forcing global login and without breaking current Enterprise Beta behavior.

## 2. Why The Field Is Nullable

The new Prisma field is:

```prisma
supabaseAuthId String? @unique
```

It is nullable because:

- Existing demo/default users must keep working.
- Existing team users may not have Supabase Auth accounts yet.
- The app is still in staged auth rollout.
- Mapping can be added gradually.

## 3. Mapping Strategy

When a Supabase session exists:

1. Find Prisma `User` by `supabaseAuthId`.
2. If not found, find Prisma `User` by matching lowercase email.
3. If an email match is found and `supabaseAuthId` is empty, attach the Supabase Auth user ID to that Prisma user.
4. Return the mapped Prisma user and its company.
5. If no matching Prisma user exists, do not auto-create a full workspace in this phase.
6. If `AUTH_ENFORCED=false`, fall back to the beta/default owner.
7. If `AUTH_ENFORCED=true`, unauthenticated or unmapped users should be blocked by future enforcement behavior.

## 4. How To Create First Admin User

Use `SUPABASE_ADMIN_USER_MAPPING.md`.

Summary:

1. Create a Supabase Auth user from Supabase Dashboard.
2. Use the same email as the existing ARBCore owner/team user.
3. Log in through `/login`.
4. Confirm `User.supabaseAuthId` is attached in the database.
5. Confirm the user maps to the correct `companyId`.

## 5. How To Test Login

With Supabase Auth configured:

1. Keep `AUTH_ENFORCED=false`.
2. Open `/login`.
3. Sign in with the Supabase Auth admin email.
4. Confirm redirect to Dashboard.
5. Confirm the matching Prisma `User` row now has `supabaseAuthId`.
6. Confirm Settings, WhatsApp Logs, Send Messages, and Auto Reply still work.

## 6. When To Enable `AUTH_ENFORCED=true`

Enable only after:

- A real admin Supabase user exists.
- The admin maps to a Prisma `User`.
- The mapped Prisma user has the correct `companyId`.
- Dashboard and core modules work after Supabase login.
- Webhook routes are confirmed public and verified.

Do not enable in production before this checklist is complete.

## 7. Rollback

If anything goes wrong:

1. Set `AUTH_ENFORCED=false`.
2. Redeploy.
3. Keep or clear `supabaseAuthId` mapping as needed.
4. Confirm beta/default owner fallback works.
5. Confirm WhatsApp webhook, logs, send, and auto reply still work.

No token or provider secret changes are required for rollback.
