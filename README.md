# ARBCore SwiftConnect

ARBCore SwiftConnect is a local MVP for an AI-powered WhatsApp marketing, CRM, and customer automation dashboard.

## Quick Start

```bash
npm install
npm run prisma:generate
npm run db:init-local
npm run dev
```

Open:

```text
http://localhost:3000
```

## Build

```bash
npm run build
```

Production start:

```bash
npm run start
```

## Database Setup

ARBCore SwiftConnect keeps SQLite for local MVP development and uses PostgreSQL for production after a controlled Prisma datasource migration.

### SQLite Local Setup

Keep `.env` configured like this for local development:

```env
DATABASE_URL="file:./local.db"
DIRECT_URL=
```

Then run:

```bash
npm run prisma:generate
npm run db:init-local
npm run dev
```

The local SQLite file is `prisma/local.db`. The `db:init-local` script is the supported local initializer for the current MVP.

### PostgreSQL Production Setup

Prisma's database provider is defined in `prisma/schema.prisma`, so production PostgreSQL requires a deliberate schema change before creating production migrations:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

Use PostgreSQL connection strings in production:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

Create and deploy Prisma migrations:

```bash
npx prisma migrate dev --name init_postgres
npm run prisma:generate
npx prisma migrate deploy
npm run db:seed
```

Do not point the current SQLite `schema.prisma` provider at a PostgreSQL URL. Switch the datasource provider first, then generate a fresh PostgreSQL migration history.

See `POSTGRES_MIGRATION_GUIDE.md` for the full production-postgres branch plan, provider-specific `DATABASE_URL`/`DIRECT_URL` notes, seeding guidance, and rollback notes.

For a Vercel deployment using Supabase PostgreSQL, see `VERCEL_SUPABASE_DEPLOYMENT_GUIDE.md`.

### Supabase, Neon, And Railway Notes

- Supabase: use the pooled connection for the app `DATABASE_URL` when appropriate, and use the direct database connection for `DIRECT_URL` so Prisma migrations can run without pooler limitations.
- Neon: use the pooled URL for runtime traffic if desired, and a direct branch connection for migrations. Keep staging and production on separate Neon branches/databases.
- Railway: use the Railway-provided PostgreSQL connection string for `DATABASE_URL`; if a separate direct URL is available, use it for `DIRECT_URL` in migration jobs.
- For all providers: enable backups, keep separate development/staging/production databases, and run `npx prisma migrate deploy` during release instead of `migrate dev`.

### Prisma Command Reference

```bash
npm run prisma:generate
npm run db:init-local
npx prisma migrate dev --name init_postgres
npx prisma migrate deploy
```

## Optional OpenAI Setup

AI Studio works without an API key by using the local mock fallback. To enable real OpenAI generation, copy `.env.example` to `.env` and set:

```env
OPENAI_API_KEY="your_openai_api_key"
OPENAI_MODEL="gpt-4o-mini"
```

Then restart the dev server. The app calls OpenAI only from the server route `POST /api/ai/generate-message`; if the key is missing or OpenAI returns an error, the route falls back to the local mock response.

## Authentication And Roles

Local MVP login remains:

```text
Email: admin@arbcore.ai
Password: demo1234
```

The local demo password is stored as a bcrypt hash in SQLite. Supported roles are `OWNER`, `ADMIN`, `MANAGER`, and `AGENT`.

Role access policy:

- `OWNER` and `ADMIN`: all modules.
- `MANAGER`: Dashboard, Contacts, Campaigns, Inbox, CRM, Analytics.
- `AGENT`: Inbox, Contacts, CRM.

Team members can be managed from Settings using local database APIs:

- `GET /api/team`
- `POST /api/team`
- `PUT /api/team/[id]`
- `PATCH /api/team/[id]/deactivate`

## Optional WhatsApp Cloud API Sandbox Setup

WhatsApp sends stay in mock/local mode unless the official Meta Cloud API environment variables are configured:

```env
WHATSAPP_ACCESS_TOKEN="your_meta_access_token"
WHATSAPP_PHONE_NUMBER_ID="your_phone_number_id"
WHATSAPP_BUSINESS_ACCOUNT_ID="your_waba_id"
WHATSAPP_VERIFY_TOKEN="choose_a_webhook_verify_token"
WHATSAPP_APP_SECRET="your_meta_app_secret"
WHATSAPP_API_VERSION="v21.0"
```

Webhook callback URL:

```text
https://your-domain.com/api/webhooks/whatsapp
```

For local testing, expose your dev server with a secure tunnel, configure the callback URL in Meta, and subscribe to WhatsApp `messages` events. The app verifies the GET challenge, validates `X-Hub-Signature-256` when `WHATSAPP_APP_SECRET` is set, stores raw webhook events, creates inbox conversations, updates message statuses, and marks STOP/unsubscribe contacts as do-not-contact.

## Deployment Notes

Keep SQLite for local development only. Production deployments should use PostgreSQL after the Prisma datasource is migrated to `provider = "postgresql"` in a production migration branch.

### Vercel

- Build command: `npm run build`
- Install command: `npm install`
- Runtime: Next.js
- Health check URL after deployment: `https://YOUR_DOMAIN/api/health`
- Add all required environment variables in the Vercel Project Settings.
- Use a managed PostgreSQL provider such as Supabase, Neon, or Railway PostgreSQL.
- Run `npx prisma migrate deploy` as part of the production release flow after PostgreSQL migrations exist.
- Run `npm run db:seed` after migrations so the demo owner login exists in PostgreSQL.

### Railway

- Build command: `npm run build`
- Start command: `npm run start`
- Health check path: `/api/health`
- Add a Railway PostgreSQL service for production database hosting.
- Set `DATABASE_URL` and `DIRECT_URL` from the production PostgreSQL service.
- Run `npx prisma migrate deploy` during deployment or in a release command.
- Run `npm run db:seed` after migrations so the demo owner login exists in PostgreSQL.

## Project Docs

- `OPERATING_MANUAL.md`: day-to-day module guide and current beta behavior.
- `LAUNCH_CHECKLIST.md`: production launch, QA, channel, auth, and rollback checklist.
- `BETA_RELEASE_NOTES.md`: current Enterprise Beta status and testing scope.
- `CLIENT_ONBOARDING_GUIDE.md`: beta client onboarding workflow.
- `BETA_FEEDBACK_FORM.md`: structured feedback template for testers.
- `SUPPORT_HANDOVER_NOTE.md`: support URLs, common issues, safety rules, and escalation steps.
- `WELZZ_STRIDE_INTERNAL_BETA_RUNBOOK.md`: internal 2-3 day beta workflow for Welzz Stride.
- `CLIENT_WORKSPACE_ONBOARDING_PLAN.md`: safe beta/admin-assisted multi-client workspace setup foundation.
- `/admin/workspaces`: beta/admin workspace creation and selected-workspace testing; not production tenant switching.
- `WORKSPACE_ISOLATION_QA_REPORT.md`: company scoping audit for beta workspace switching.
- `WORKSPACE_SWITCHING_TEST_CHECKLIST.md`: manual beta/admin workspace switching test steps.
- `PROVIDER_WEBHOOK_ROUTING_PLAN.md`: provider-based webhook routing foundation for WhatsApp and Messenger.
- `STRICT_PROVIDER_WEBHOOK_ROUTING.md`: opt-in strict unmatched-provider webhook behavior.
- `PRODUCTION_DEPLOYMENT_VERIFICATION.md`: post-deployment production verification guide.
- `PRODUCTION_MANUAL_QA_CHECKLIST.md`: manual production QA checklist.
- `SUPABASE_PRODUCTION_MIGRATION_CHECKLIST.md`: Supabase production migration verification checklist.

Read-only production verification script:

```powershell
$env:PRODUCTION_URL="https://arbcore-swiftconnect.vercel.app"
npm.cmd run verify:production
```

The verification script performs GET checks only. It does not call send endpoints, webhook POST endpoints, or mutation endpoints.

### Production Environment Checklist

```env
DATABASE_URL=
DIRECT_URL=
OPENAI_API_KEY=
OPENAI_MODEL=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_APP_SECRET=
WHATSAPP_API_VERSION=
SESSION_SECRET=
```

Security notes:

- Never commit `.env`.
- Rotate API keys if they are exposed.
- Use HTTPS for production and webhook URLs.
- Set the Meta webhook URL to `https://YOUR_DOMAIN/api/webhooks/whatsapp`.
- Use PostgreSQL in production, not SQLite.
- Enable database backups.
- Keep `SESSION_SECRET` long, random, private, and rotated if exposed.

## Useful API Checks

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/dashboard/statistics" -UseBasicParsing
Invoke-WebRequest -Uri "http://localhost:3000/api/contacts" -UseBasicParsing
Invoke-WebRequest -Uri "http://localhost:3000/api/analytics/summary" -UseBasicParsing
Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing
```

## Notes

- Local database: `prisma/local.db`
- Database URL: `DATABASE_URL="file:./local.db"`
- Production database target: PostgreSQL after switching the Prisma datasource provider and creating migrations.
- Deployment checklist: `DEPLOYMENT_CHECKLIST.md`
- WhatsApp integration uses official Meta Cloud API only when sandbox env vars are configured; otherwise it stays mock/local.
- AI Studio can use OpenAI when `OPENAI_API_KEY` is configured, otherwise it stays mock/local.
- Full development status and next steps are in `DEVELOPMENT_STATUS.md`.
