# Supabase DB Connection Guide

## Purpose

Use this guide to choose and verify safe Supabase database connection strings for ARBCore SwiftConnect production runtime and Prisma migrations.

Do not paste real database URLs into this document, tickets, screenshots, or chat.

## Pooled vs Direct Supabase URLs

Supabase commonly provides two useful PostgreSQL connection styles:

- Pooled connection: optimized for app/runtime traffic and serverless environments.
- Direct connection: connects directly to the database and is better suited for Prisma migrations.

## Recommended Use

Use:

```env
DATABASE_URL=pooled Supabase connection for app/runtime
DIRECT_URL=direct Supabase connection for Prisma migrations
```

For ARBCore SwiftConnect:

- `DATABASE_URL` is used by Prisma at runtime.
- `DIRECT_URL` is used by Prisma for direct migration operations when configured in `prisma/schema.prisma`.

## How To Identify A Pooled URL Safely

A Supabase pooled URL often has one or more of these signs:

- Host includes `pooler.supabase.com`.
- Port is commonly `6543`.
- Query string includes pool-related options such as `pgbouncer` or pool settings.

Do not print the full URL. Only confirm the classification.

## How To Identify A Direct URL Safely

A Supabase direct URL often has one or more of these signs:

- Host includes `db.` and `supabase.co`.
- Port is commonly `5432`.
- It is labeled as a direct/session database connection in Supabase.

Do not print the full URL. Only confirm the classification.

## Why A Pooled `DIRECT_URL` Is A Warning

Prisma migrations need a stable direct database connection. A pooled URL can cause migration issues or unexpected connection behavior.

If `npm.cmd run verify:production` reports that `DIRECT_URL` appears pooled:

1. Do not run production migrations yet.
2. Open Supabase database connection settings.
3. Copy the direct/session connection string.
4. Store it in the trusted local release environment or Vercel environment variable as `DIRECT_URL`.
5. Re-run `npm.cmd run verify:production`.

## Where To Configure Values

Local release environment:

```env
DATABASE_URL=
DIRECT_URL=
```

Vercel:

- Project Settings
- Environment Variables
- Production environment

Only trusted operators should configure or view these values.

## Safety

- Never commit real database URLs.
- Never screenshot database URLs.
- Never paste database URLs into support tickets or public docs.
- Rotate credentials if a URL is exposed.
- Keep `.env.example` as placeholders only.
- Use `PRODUCTION_MIGRATION_READINESS_CHECKLIST.md` before applying production migrations.
- Use `SUPABASE_PRODUCTION_MIGRATION_CHECKLIST.md` after migration to verify production readiness.
