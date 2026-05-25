# ARBCore SwiftConnect Vercel + Supabase Deployment Guide

This guide explains how to deploy ARBCore SwiftConnect to Vercel with Supabase PostgreSQL. It assumes the current SQLite MVP branch remains unchanged and PostgreSQL work happens in a separate `production-postgres` branch.

## 1. Create A Supabase Project

1. Go to Supabase and create a new project.
2. Choose the production organization.
3. Set a strong database password and store it securely.
4. Select the region closest to your main users.
5. Wait for Supabase to finish provisioning the project.
6. Enable backups according to your production plan.

Recommended setup:

- One Supabase project for staging.
- One separate Supabase project for production.
- Never use the local SQLite database in production.

## 2. Copy PostgreSQL `DATABASE_URL` And `DIRECT_URL`

In Supabase:

1. Open the project dashboard.
2. Go to Project Settings.
3. Open Database.
4. Find the connection strings.

Use:

- `DATABASE_URL`: pooled connection string for app runtime when using the Supabase pooler.
- `DIRECT_URL`: direct connection string for Prisma migrations.

Example shape:

```env
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres?schema=public"
```

Check Supabase's current dashboard labels because connection string names can vary. The important rule is: app runtime can use pooled; Prisma migrations should use direct.

## 3. Create A `production-postgres` Branch

Create a branch for PostgreSQL migration work:

```bash
git checkout -b production-postgres
```

Do not modify the current SQLite MVP branch.

## 4. Update Prisma Datasource For PostgreSQL

In `prisma/schema.prisma`, change:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

To:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

Only make this change in the `production-postgres` branch.

## 5. Run Prisma Migration

Set your local `.env` in the `production-postgres` branch to point to a staging Supabase database first.

Create the initial PostgreSQL migration:

```bash
npx prisma migrate dev --name init_postgres
```

Generate Prisma Client:

```bash
npx prisma generate
```

For production deployment, use:

```bash
npx prisma migrate deploy
```

Do not run `npx prisma migrate dev` against production.

## 6. Deploy The Next.js App To Vercel

1. Push the `production-postgres` branch to your Git remote.
2. Open Vercel.
3. Create a new project.
4. Import the ARBCore SwiftConnect repository.
5. Select the `production-postgres` branch for deployment.
6. Framework preset: Next.js.
7. Build command: `npm run build`.
8. Install command: `npm install`.
9. Add environment variables before the first production deployment.
10. Deploy.

If migrations are not run automatically by your deployment flow, run:

```bash
npx prisma migrate deploy
```

against the production Supabase database before sending real traffic.

## 7. Required Vercel Environment Variables

Add these in Vercel Project Settings > Environment Variables:

```env
DATABASE_URL=
DIRECT_URL=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_APP_SECRET=
WHATSAPP_API_VERSION=v21.0
SESSION_SECRET=
```

Required for production baseline:

- `DATABASE_URL`
- `DIRECT_URL`
- `SESSION_SECRET`

Required for real AI Studio:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`

Required for WhatsApp Cloud API sandbox:

- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_BUSINESS_ACCOUNT_ID`
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_APP_SECRET`
- `WHATSAPP_API_VERSION`

Security reminders:

- Never commit `.env`.
- Keep `SESSION_SECRET` long, random, and private.
- Rotate keys if exposed.
- Use only Vercel encrypted environment variables for production secrets.

## 8. Test `/api/health` After Deployment

After Vercel deploys, open:

```text
https://your-domain.com/api/health
```

Expected response shape:

```json
{
  "success": true,
  "data": {
    "app": {
      "name": "ARBCore SwiftConnect",
      "status": "ok"
    },
    "database": {
      "status": "ok"
    },
    "environment": {
      "mode": "production"
    },
    "ai": {
      "configured": true
    },
    "whatsapp": {
      "configured": true
    },
    "timestamp": "2026-05-26T00:00:00.000Z"
  }
}
```

If `database.status` is `error`, check Supabase connection strings, Prisma provider, and whether migrations were deployed.

## 9. Configure WhatsApp Webhook URL

In Meta Developer settings for the WhatsApp app, set:

```text
https://your-domain.com/api/webhooks/whatsapp
```

Use the same verify token as:

```env
WHATSAPP_VERIFY_TOKEN=
```

Subscribe to WhatsApp `messages` events.

The app supports:

- GET webhook verification.
- POST webhook event storage.
- Incoming message parsing.
- Message status updates.
- STOP/unsubscribe detection.

## 10. Test OpenAI Configuration

1. Set `OPENAI_API_KEY` and `OPENAI_MODEL` in Vercel.
2. Redeploy or restart the deployment.
3. Login to ARBCore SwiftConnect.
4. Open AI Studio.
5. Generate a campaign or follow-up message.
6. Confirm the response is generated successfully.

If `OPENAI_API_KEY` is missing or invalid, the app should fall back to local mock output instead of breaking.

## 11. Test WhatsApp Sandbox Test-Send

1. Set all WhatsApp environment variables in Vercel.
2. Redeploy.
3. Login to ARBCore SwiftConnect.
4. Open Connect.
5. Check the WhatsApp test panel environment status.
6. Enter a sandbox-approved recipient number.
7. Enter a test message.
8. Click send.
9. Confirm message log creation and WhatsApp delivery in the sandbox.

If WhatsApp variables are missing, the app should keep using mock send behavior.

## 12. Common Deployment Errors And Fixes

### `database.status` is `error` in `/api/health`

Fixes:

- Confirm `DATABASE_URL` is set in Vercel.
- Confirm `DIRECT_URL` is set for Prisma migrations.
- Confirm `prisma/schema.prisma` uses `provider = "postgresql"` in the `production-postgres` branch.
- Run `npx prisma migrate deploy`.
- Check Supabase password, host, port, and SSL requirements.

### Prisma migration fails with pooled connection

Fixes:

- Use Supabase direct connection for `DIRECT_URL`.
- Keep pooled URL only for `DATABASE_URL`.
- Run migrations from a trusted environment with direct DB access.

### Vercel build fails

Fixes:

- Run `npm.cmd run build` locally first.
- Confirm environment variables exist for production build.
- Run `npx prisma generate`.
- Check TypeScript errors in the Vercel build log.

### Login fails after deployment

Fixes:

- Confirm production database is seeded with the demo/owner user.
- Confirm password hash was created with bcrypt.
- Confirm cookies are allowed over HTTPS.
- Confirm `SESSION_SECRET` is set for production hardening.

### WhatsApp webhook verification fails

Fixes:

- Confirm Meta webhook URL is exactly `https://your-domain.com/api/webhooks/whatsapp`.
- Confirm `WHATSAPP_VERIFY_TOKEN` in Vercel matches the token entered in Meta.
- Redeploy after changing env variables.

### OpenAI returns errors

Fixes:

- Confirm `OPENAI_API_KEY` is valid.
- Confirm `OPENAI_MODEL` is available to the key.
- Check usage limits and billing in the OpenAI account.
- The app should fall back to mock generation if OpenAI fails.

## 13. Rollback Process

Code rollback:

1. Use Vercel's previous deployment rollback.
2. Confirm `/api/health` after rollback.
3. Keep the previous deployment available until smoke tests pass.

Database rollback:

1. Take a Supabase backup before migrations.
2. Prisma migrations are forward-first; do not assume automatic rollback.
3. If migration damage occurs, restore the database backup or apply a reviewed corrective migration.
4. Freeze writes during major data import or cutover.

Environment rollback:

1. Revert changed Vercel environment variables.
2. Redeploy after env changes.
3. If WhatsApp/OpenAI credentials cause errors, temporarily unset them to return to mock fallback behavior.

Final rule: never roll production back to SQLite. SQLite remains local MVP only.
