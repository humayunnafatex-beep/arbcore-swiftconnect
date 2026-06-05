# Production Migration Safety

## Purpose

Use this guide before any Prisma migration work against the ARBCore SwiftConnect Supabase production database.

This is a safety document only. It does not authorize production database resets, destructive SQL, or unreviewed environment changes.

## Core Rule

`DATABASE_URL` may use a pooled Supabase connection for app/runtime traffic.

`DIRECT_URL` should use the direct, non-pooled Supabase database connection before running Prisma production migrations.

If `npm.cmd run verify:production` warns that `DIRECT_URL` appears pooled, the app may still run normally, but production migration work should pause until `DIRECT_URL` is corrected in the trusted release environment.

## How To Identify Pooled Supabase URLs

A pooled Supabase URL often has one or more of these signs:

- Host includes `pooler.supabase.com`.
- Port is commonly `6543`.
- Query string includes pool-related options such as `pgbouncer`, `pool`, or connection pool settings.

Use pooled URLs for runtime/serverless app traffic when appropriate. Do not print or paste the full URL in tickets, docs, screenshots, or chat.

## How To Identify Direct Supabase URLs

A direct Supabase URL often has one or more of these signs:

- Host starts with `db.` and includes `supabase.co`.
- Port is commonly `5432`.
- Supabase labels it as the direct/session database connection.

Use the direct URL for Prisma migration work. Do not expose the full URL.

## DATABASE_URL vs DIRECT_URL

Use:

```env
DATABASE_URL=pooled Supabase URL for app runtime
DIRECT_URL=direct Supabase URL for Prisma migrations
```

In Prisma:

- `DATABASE_URL` is the normal Prisma connection string used by app runtime.
- `DIRECT_URL` is the direct connection Prisma can use for migration operations when configured in `prisma/schema.prisma`.

## Safe Steps Before Production Migrations

1. Confirm the target branch and commit.
2. Confirm the working tree is clean.
3. Confirm the Supabase project is the intended production project.
4. Confirm backups or exports are available before risky changes.
5. Run:

```powershell
git status
npx prisma generate
npm.cmd run build
npm.cmd run verify:production
```

6. Confirm `DATABASE_URL` classification is understood.
7. Confirm `DIRECT_URL` is direct/non-pooled.
8. Confirm no blocker exists in the production verifier.
9. Confirm `PRODUCTION_MIGRATION_READINESS_CHECKLIST.md` is complete.
10. Apply migrations only through the approved deploy flow, usually:

```powershell
npx prisma migrate deploy
```

## Do Not Run

Never run these against production:

```powershell
npx prisma migrate reset
npx prisma migrate dev
```

Do not manually delete rows from `_prisma_migrations`.

Do not run destructive SQL without a reviewed rollback plan and explicit approval.

## If DIRECT_URL Is Pooled

If the verifier shows a `DIRECT_URL` pooled warning:

1. Treat it as a migration safety warning, not a runtime outage.
2. Do not run production migrations yet.
3. Open Supabase database connection settings.
4. Copy the direct/session connection string into the trusted release environment as `DIRECT_URL`.
5. Do not paste the value into docs, screenshots, chat, or issue trackers.
6. Re-run `npm.cmd run verify:production`.
7. Continue only after the warning is understood or resolved by the migration owner.

## Post-Migration Verification

After migration:

```powershell
npm.cmd run verify:production
```

Then confirm:

- Dashboard loads.
- Inbox loads.
- Follow-up Queue loads.
- Message Logs load.
- Settings loads.
- Orders and Products load.
- No database URLs, tokens, cookies, sessions, or provider secrets are exposed.

## Related Documents

- `SUPABASE_DB_CONNECTION_GUIDE.md`
- `PRODUCTION_MIGRATION_READINESS_CHECKLIST.md`
- `SUPABASE_PRODUCTION_MIGRATION_CHECKLIST.md`
- `INCIDENT_RESPONSE_RUNBOOK.md`
- `LAUNCH_CHECKLIST.md`
