# ARBCore SwiftConnect PostgreSQL Migration Guide

This guide describes how to prepare a separate production PostgreSQL migration branch while keeping the current local SQLite MVP branch unchanged.

Do not apply these Prisma datasource changes directly to the current SQLite branch unless you are intentionally creating the production PostgreSQL branch.

## 1. Create A Production Branch

From the current working version, create a separate branch:

```bash
git checkout -b production-postgres
```

Goal of this branch:

- Keep app behavior the same.
- Switch Prisma datasource from SQLite to PostgreSQL.
- Create a PostgreSQL migration history.
- Prepare production deployment with managed PostgreSQL.

The current local branch should keep:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

## 2. Update `prisma/schema.prisma`

In the `production-postgres` branch only, change the datasource from SQLite:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

To PostgreSQL:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

Use `directUrl` when the runtime `DATABASE_URL` uses a pooled connection. This is common with Supabase, Neon, and other managed providers. Prisma migrations should use a direct database connection.

If your provider gives only one non-pooled PostgreSQL URL, `DATABASE_URL` and `DIRECT_URL` may temporarily use the same value, but a separate direct URL is preferred.

## 3. Configure Environment Variables

Production PostgreSQL requires:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

Keep local SQLite development on the current branch with:

```env
DATABASE_URL="file:./local.db"
DIRECT_URL=
```

### Supabase

- `DATABASE_URL`: use the pooled connection string for application runtime when recommended by Supabase.
- `DIRECT_URL`: use the direct connection string for Prisma migrations.
- Confirm SSL requirements from the Supabase dashboard.
- Keep staging and production as separate Supabase projects or databases.

### Neon

- `DATABASE_URL`: use the pooled connection string for runtime traffic if pooling is enabled.
- `DIRECT_URL`: use the direct branch/database connection for migrations.
- Use separate Neon branches or databases for staging and production.
- Avoid running development migrations against the production branch.

### Railway

- `DATABASE_URL`: use the Railway PostgreSQL connection string for the deployed service.
- `DIRECT_URL`: use a direct connection string if Railway exposes one; otherwise use the same PostgreSQL URL for migrations with care.
- Use separate Railway environments or projects for staging and production.

## 4. Generate The Initial PostgreSQL Migration

After switching `schema.prisma` to PostgreSQL and setting PostgreSQL environment variables, create the initial migration in a development or staging database:

```bash
npx prisma migrate dev --name init_postgres
```

Then regenerate the Prisma client:

```bash
npx prisma generate
```

Review the generated files under:

```text
prisma/migrations/
```

Do not create migrations against production with `migrate dev`.

## 5. Deploy Migrations To Production

For production deploys, run:

```bash
npx prisma migrate deploy
npx prisma generate
```

Recommended release order:

1. Build the application.
2. Deploy code with PostgreSQL datasource support.
3. Run `npx prisma migrate deploy`.
4. Run smoke tests.
5. Check `/api/health`.

## 6. Safe Production Seeding

Do not copy the local SQLite database file to production.

Use a controlled seed process:

1. Create the default company/workspace.
2. Create the owner/admin user with a bcrypt-hashed password.
3. Seed only safe default records, such as approved demo templates.
4. Never seed real API keys, WhatsApp tokens, OpenAI keys, or private credentials.
5. Keep seed scripts idempotent so they can run more than once safely.
6. Verify counts after seeding:
   - companies
   - users
   - templates
   - contacts, if imported
   - campaigns, if imported
   - conversations and message logs, if imported

For real customer data migration:

- Export SQLite data to JSON or CSV.
- Normalize enum values before import.
- Preserve `optedIn` and `doNotContact` exactly.
- Import into PostgreSQL through a reviewed script.
- Run import first in staging.
- Compare record counts and sample records before production cutover.

## 7. Rollback Notes

Plan rollback before deploying.

Code rollback:

- Keep the previous production deployment available.
- If the new deployment fails before migrations, roll back the app deployment.

Database rollback:

- Take a PostgreSQL backup before migration deploy.
- Prisma migrations are usually forward-only; do not assume automatic down migrations.
- If a migration breaks production data, restore from backup or apply a reviewed corrective migration.
- Keep write activity frozen during final data import when cutting over from SQLite.

Environment rollback:

- Keep old environment variables documented.
- If WhatsApp/OpenAI variables are misconfigured, unset them to return to mock fallback where applicable.
- Do not point production back to SQLite.

## 8. Verification Checklist

Before release:

```bash
npm run build
npx prisma migrate deploy
npx prisma generate
```

After release:

```text
GET /api/health
```

Confirm:

- App status is `ok`.
- Database status is `ok`.
- Login works.
- Dashboard loads.
- Contacts, Campaigns, Inbox, CRM, Settings, and Team APIs are reachable.
- WhatsApp sends remain mock unless production WhatsApp variables are intentionally configured.
- AI generation remains mock unless `OPENAI_API_KEY` is intentionally configured.

## 9. Important Safety Rules

- Do not modify the current SQLite MVP branch for this migration plan.
- Do not use SQLite in production.
- Do not run `npx prisma migrate dev` against production.
- Do not commit `.env`.
- Keep `DATABASE_URL`, `DIRECT_URL`, API keys, and `SESSION_SECRET` in platform secrets only.
- Back up production PostgreSQL before migration deploys.
