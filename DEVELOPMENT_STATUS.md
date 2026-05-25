# ARBCore SwiftConnect Development Status

Last updated: 2026-05-25

## 1. Project Overview

ARBCore SwiftConnect is an AI-powered WhatsApp marketing, CRM, and customer automation SaaS dashboard. The current version is a local frontend and backend MVP built as a Next.js application.

The product currently supports:

- Dashboard metrics
- WhatsApp account management and Cloud API sandbox foundation
- Contact CRUD and import
- Campaign creation and mock sending
- Message logs
- Conversation inbox
- Auto reply rules
- CRM pipeline records
- AI message generation with optional OpenAI API and mock fallback
- Analytics summary

The app can connect to the official WhatsApp Cloud API in sandbox mode when Meta environment variables are configured; otherwise WhatsApp sends remain mock/local. AI Studio can connect to OpenAI when `OPENAI_API_KEY` is configured; otherwise it uses the local mock fallback.

## 2. Current Completed Features

- Premium blue-white ARBCore SaaS dashboard UI
- Responsive sidebar navigation and topbar
- Dashboard route connected to live backend statistics
- Separate frontend pages for all sidebar menu items
- Live API-backed workbench sections on supported pages
- Loading, empty, error, and success toast states
- Next.js API route backend
- Demo cookie authentication with bcrypt-hashed local password
- User roles: `OWNER`, `ADMIN`, `MANAGER`, and `AGENT`
- Reusable role/module access helpers for future route and API protection
- Settings Team Members section backed by local company-scoped APIs
- Prisma schema for the current domain model
- Local SQLite database setup
- Reusable API response/error helpers
- Zod request validation
- CSV/Excel/JSON contact import endpoint
- Mock campaign send flow that creates message logs
- AI reply generation saved to database
- OpenAI Responses API integration with mock fallback
- AI usage tracking through `AIUsage`
- WhatsApp Cloud API service layer with mock fallback
- WhatsApp webhook verification, raw payload storage, inbound conversation creation, status update handling, and STOP/unsubscribe detection
- Stabilized toast callback behavior to avoid unnecessary refetch loops in API-backed pages
- Stabilized unsubscribe preservation during contact import and WhatsApp test sends
- Hardened OpenAI response parsing so malformed/non-standard responses fall back gracefully
- Footer with WhatsApp number and ARBCore AI copyright

## 3. Tech Stack

- Framework: Next.js 14 App Router
- Frontend: React 18, TypeScript
- Styling: Tailwind CSS
- Icons: lucide-react
- Charts: Recharts
- Backend: Next.js API route handlers
- ORM: Prisma 6
- Database: SQLite for local development
- Validation: Zod
- Spreadsheet import parsing: xlsx

## 4. Folder/File Structure

```text
.
|-- app/
|   |-- api/
|   |   |-- ai/generate-message/route.ts
|   |   |-- analytics/summary/route.ts
|   |   |-- auto-reply/rules/route.ts
|   |   |-- auto-reply/rules/[id]/route.ts
|   |   |-- campaigns/route.ts
|   |   |-- campaigns/[id]/send/route.ts
|   |   |-- contacts/route.ts
|   |   |-- contacts/[id]/route.ts
|   |   |-- contacts/import/route.ts
|   |   |-- conversations/route.ts
|   |   |-- conversations/[id]/route.ts
|   |   |-- crm/pipeline/route.ts
|   |   |-- dashboard/statistics/route.ts
|   |   |-- messages/logs/route.ts
|   |   |-- team/route.ts
|   |   |-- team/[id]/route.ts
|   |   |-- team/[id]/deactivate/route.ts
|   |   `-- whatsapp/accounts/route.ts
|   |-- api/whatsapp/test-send/route.ts
|   |-- api/webhooks/whatsapp/route.ts
|   |-- ai-studio/page.tsx
|   |-- analytics/page.tsx
|   |-- auto-reply/page.tsx
|   |-- campaigns/page.tsx
|   |-- connect/page.tsx
|   |-- contacts/page.tsx
|   |-- crm/page.tsx
|   |-- license/page.tsx
|   |-- send-messages/page.tsx
|   |-- settings/page.tsx
|   |-- globals.css
|   |-- layout.tsx
|   `-- page.tsx
|-- components/
|   |-- app-shell.tsx
|   |-- dashboard-shell.tsx
|   |-- live-api-section.tsx
|   |-- metric-card.tsx
|   |-- module-page.tsx
|   |-- sidebar.tsx
|   |-- topbar.tsx
|   `-- other reusable dashboard components
|-- data/
|   |-- dashboard.ts
|   `-- module-pages.ts
|-- lib/
|   |-- api.ts
|   |-- api-client.ts
|   |-- prisma.ts
|   |-- utils.ts
|   `-- validators.ts
|-- prisma/
|   |-- schema.prisma
|   `-- local.db
|-- scripts/
|   `-- init-sqlite.mjs
|-- .env
|-- package.json
|-- tailwind.config.ts
`-- tsconfig.json
```

## 5. Available Frontend Pages

- `/` - Dashboard
- `/connect` - WhatsApp account connection management
- `/contacts` - Contact management and import
- `/campaigns` - Campaign creation/list/send
- `/send-messages` - Message logs and conversation inbox
- `/ai-studio` - Mock AI message generation
- `/auto-reply` - Auto reply rule management
- `/crm` - CRM pipeline and deal creation
- `/analytics` - Analytics summary
- `/settings` - Local settings and team member management
- `/license` - Static license page placeholder

## 6. Available Backend API Endpoints

Dashboard:

- `GET /api/dashboard/statistics`

WhatsApp accounts:

- `GET /api/whatsapp/accounts`
- `POST /api/whatsapp/accounts`
- `GET /api/whatsapp/test-send`
- `POST /api/whatsapp/test-send`

WhatsApp webhooks:

- `GET /api/webhooks/whatsapp`
- `POST /api/webhooks/whatsapp`

Contacts:

- `GET /api/contacts`
- `POST /api/contacts`
- `GET /api/contacts/[id]`
- `PUT /api/contacts/[id]`
- `DELETE /api/contacts/[id]`
- `POST /api/contacts/import`

Campaigns:

- `GET /api/campaigns`
- `POST /api/campaigns`
- `POST /api/campaigns/[id]/send`

Messages and conversations:

- `GET /api/messages/logs`
- `GET /api/conversations`
- `POST /api/conversations`
- `GET /api/conversations/[id]`
- `POST /api/conversations/[id]`

Auto replies:

- `GET /api/auto-reply/rules`
- `POST /api/auto-reply/rules`
- `GET /api/auto-reply/rules/[id]`
- `PUT /api/auto-reply/rules/[id]`
- `DELETE /api/auto-reply/rules/[id]`

CRM:

- `GET /api/crm/pipeline`
- `POST /api/crm/pipeline`

AI:

- `POST /api/ai/generate-message`

Analytics:

- `GET /api/analytics/summary`

Team:

- `GET /api/team`
- `POST /api/team`
- `PUT /api/team/[id]`
- `PATCH /api/team/[id]/deactivate`

## 7. Database Setup

The local MVP uses SQLite through Prisma.

Current `.env`:

```env
DATABASE_URL="file:./local.db"
DIRECT_URL=
OPENAI_API_KEY=
OPENAI_MODEL="gpt-4o-mini"
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_APP_SECRET=
WHATSAPP_API_VERSION="v21.0"
```

Local demo login:

```text
Email: admin@arbcore.ai
Password: demo1234
```

The demo user is stored with a bcrypt-hashed password and the `OWNER` role.

Important files:

- Prisma schema: `prisma/schema.prisma`
- Local database: `prisma/local.db`
- Prisma client helper: `lib/prisma.ts`
- Local database initializer: `scripts/init-sqlite.mjs`

Recommended local setup:

```bash
npm install
npm run prisma:generate
npm run db:init-local
```

`npm run db:push` is available, but the local Windows sandbox blocked the Prisma schema engine during earlier testing. The custom `db:init-local` script was added to create the SQLite tables reliably for this workspace.

Provider strategy:

- Local MVP: keep `prisma/schema.prisma` on `provider = "sqlite"` and use `DATABASE_URL="file:./local.db"`.
- Production: switch the Prisma datasource provider to PostgreSQL in a production migration branch, add `directUrl = env("DIRECT_URL")`, and create a fresh Prisma migration history for PostgreSQL.
- Do not try to switch providers only by changing `DATABASE_URL`; Prisma's provider is compiled from the schema.

## 8. Local Setup Commands

```bash
npm install
npm run prisma:generate
npm run db:init-local
npm run build
```

Optional:

```bash
npm run lint
```

## 9. How To Run The App

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Production-style build and start:

```bash
npm run build
npm run start
```

## 10. How To Test The API

Start the app first:

```bash
npm run dev
```

Then test with PowerShell:

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/dashboard/statistics" -UseBasicParsing
```

Create a WhatsApp account:

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:3000/api/whatsapp/accounts" `
  -Method Post `
  -ContentType "application/json" `
  -Body (@{
    label = "ARBCore Official"
    phoneNumber = "01817030127"
    businessName = "ARBCore AI"
    status = "CONNECTED"
    qualityRating = "GOOD"
    dailyLimit = 10000
  } | ConvertTo-Json)
```

Create a contact:

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:3000/api/contacts" `
  -Method Post `
  -ContentType "application/json" `
  -Body (@{
    name = "Demo Customer"
    phone = "01817030128"
    segment = "New Leads"
    stage = "NEW_LEAD"
    optedIn = $true
  } | ConvertTo-Json)
```

Generate a mock AI reply:

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:3000/api/ai/generate-message" `
  -Method Post `
  -ContentType "application/json" `
  -Body (@{
    prompt = "Please send the product catalog"
    context = "catalog request"
    tone = "friendly"
    customerName = "Sadia"
  } | ConvertTo-Json)
```

Import contacts through JSON:

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:3000/api/contacts/import" `
  -Method Post `
  -ContentType "application/json" `
  -Body (@{
    rows = @(
      @{
        name = "Imported Customer"
        phone = "01817030129"
        segment = "VIP Buyers"
        optedIn = $true
      }
    )
  } | ConvertTo-Json -Depth 5)
```

CSV/Excel import also supports multipart upload with a `file` field.

## 11. Current Mock Features

- WhatsApp account connection records are local data.
- Campaign send calls official WhatsApp Cloud API only when WhatsApp env vars are configured.
- Campaign send creates local message logs for both mock and Cloud API sends.
- AI generation uses OpenAI only when `OPENAI_API_KEY` is configured.
- AI generation falls back to a local mock response when the key is missing or the OpenAI request fails.
- Analytics are calculated from local database records.
- Settings are local/mock except Team Members, which are stored in the local database.
- License page is a static placeholder.
- Robot avatar expects `/arbcore-ai-robot.png`; fallback UI appears if the file is missing.

## 12. Known Limitations

- Authentication is local demo cookie auth only; production OAuth/SAML is not implemented.
- Role helpers exist, but not every module route has full role-specific UI hiding yet.
- Company scoping exists for local MVP data, but production tenant hardening is still needed.
- WhatsApp webhook receiver exists for sandbox foundation, but production hardening is still needed.
- No WhatsApp template approval workflow.
- Delivery/read status callbacks are parsed locally when Meta webhook events are received.
- No real OpenAI request handling unless `OPENAI_API_KEY` is configured.
- No background jobs or queue for campaign sending.
- No rate limiting.
- No CSRF protection for mutating routes.
- No file storage strategy for production imports.
- No test suite yet.
- No Prisma migration history yet; local DB is initialized by script.
- SQLite is suitable only for local MVP development.
- npm audit currently reports dependency findings that should be reviewed before production.

## 13. Recommended Next Development Phases

Phase 1: Auth and workspace model

- Replace demo cookie auth with production sessions/OAuth when ready.
- Add invitation flow, password reset, audit logs, and session management.
- Expand UI route gating based on role permissions.

Phase 2: Production database and migrations

- Move from SQLite to PostgreSQL.
- Add proper Prisma migrations.
- Add seeds for development/demo data.

Phase 3: WhatsApp Cloud API integration

- Complete production Meta app credential management.
- Expand template send workflows and approval state sync.
- Add retry queues, rate limits, and production webhook monitoring.
- Add production signature enforcement and audit logs.

Phase 4: OpenAI integration

- Expand OpenAI model calls beyond the current AI Studio route.
- Add prompt templates, safety rules, and approval workflows.
- Add usage tracking and credit accounting.

Phase 5: Campaign engine

- Add background queue.
- Add batching, retries, rate limits, and send windows.
- Add opt-in enforcement and unsubscribe handling.

Phase 6: Testing and production hardening

- Add unit/integration tests.
- Add API contract tests.
- Add audit logs.
- Add monitoring and error reporting.

## 14. Production Migration Plan From SQLite To PostgreSQL

The current checked-in Prisma schema intentionally stays SQLite-compatible so local development and `npm run db:init-local` continue to work. PostgreSQL production migration should happen in a controlled branch/release where Prisma migrations are introduced for the production provider.

1. Provision PostgreSQL

- Use managed PostgreSQL for production.
- Enable automated backups.
- Configure separate development, staging, and production databases.
- Recommended providers: Supabase, Neon, Railway, or another managed PostgreSQL host with automated backups and migration-friendly direct connections.

2. Update environment variables

Local SQLite:

```env
DATABASE_URL="file:./local.db"
DIRECT_URL=
```

Production PostgreSQL:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

Provider notes:

- Supabase: use the pooled URL for app runtime if needed and the direct connection string for `DIRECT_URL`.
- Neon: use a production branch/database and keep migration jobs on a direct connection.
- Railway: use the managed PostgreSQL URL and separate staging/production services where possible.

3. Update Prisma datasource

Change `prisma/schema.prisma` datasource from SQLite to PostgreSQL:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

Important: Prisma does not support safely changing SQLite to PostgreSQL through `DATABASE_URL` alone. The provider must be changed in the schema, then migrations must be generated for PostgreSQL.

4. Check PostgreSQL compatibility

Current schema compatibility review:

- Prisma enums map cleanly to PostgreSQL enum types.
- `Json` fields map to PostgreSQL JSON/JSONB-compatible storage.
- `DateTime`, `Boolean`, `Float`, `Int`, and `String` fields are PostgreSQL-compatible.
- Relation actions such as `Cascade` and `SetNull` are supported.
- Composite unique constraint `@@unique([companyId, name])` and existing indexes are supported.

Before production, add any missing high-traffic indexes after observing real query patterns, especially around `companyId`, `createdAt`, `status`, `phone`, `campaignId`, `contactId`, and `whatsappAccountId`.

5. Create Prisma migrations

Development or staging migration creation:

```bash
npx prisma migrate dev --name init_postgres
npm run prisma:generate
```

Local SQLite initializer remains:

```bash
npm run db:init-local
```

6. Deploy migrations

```bash
npx prisma migrate deploy
```

Run `migrate deploy` in production release jobs. Do not use `migrate dev` against production.

7. Data migration

- Export SQLite data to JSON or CSV.
- Normalize enum/status values.
- Import into PostgreSQL with a controlled seed/import script.
- Verify counts for contacts, campaigns, messages, conversations, CRM deals, and auto reply rules.
- Recheck `doNotContact` and `optedIn` values before enabling real campaign sending.

8. Add production indexes

- Index workspace IDs after workspace isolation is added.
- Index `createdAt`, `status`, `phone`, `campaignId`, `contactId`, and `whatsappAccountId`.
- Add composite indexes for common analytics queries.

9. Cutover

- Freeze writes during final import.
- Run migration/import.
- Run API smoke tests.
- Switch app environment to PostgreSQL.
- Monitor logs and database metrics.

10. Command reference

```bash
npm run prisma:generate
npm run db:init-local
npx prisma migrate dev --name init_postgres
npx prisma migrate deploy
```

Verification status:

- SQLite local workflow remains unchanged.
- PostgreSQL migration path is documented but not activated in the current local schema.
- `npm.cmd run build` should be run after documentation/schema changes before release.

## 15. Security Notes Before Real WhatsApp/OpenAI Integration

- Add authentication before exposing API routes beyond local development.
- Add workspace/tenant authorization checks to every query.
- Store API keys only in environment variables or a secret manager.
- Never commit real Meta/OpenAI credentials.
- Validate WhatsApp webhook verification tokens and request signatures.
- Add request rate limits for campaign, import, AI, and login endpoints.
- Enforce WhatsApp opt-in and unsubscribe rules before sending messages.
- Add audit logs for campaign sends, contact imports, rule changes, and AI auto-send actions.
- Add human approval for AI-generated outbound messages at first.
- Redact sensitive customer data from logs.
- Encrypt sensitive tokens at rest if stored in the database.
- Add CSRF protection or same-site controls for browser-authenticated mutation routes.
- Review OpenAI data retention and privacy requirements before sending customer messages to AI models.
- Add content safety checks before AI replies are sent to customers.

## 16. OpenAI AI Studio Setup

The AI route supports both real OpenAI and local mock mode.

Environment variables:

```env
OPENAI_API_KEY="your_openai_api_key"
OPENAI_MODEL="gpt-4o-mini"
```

Behavior:

- If `OPENAI_API_KEY` exists, `POST /api/ai/generate-message` calls OpenAI's Responses API.
- If `OPENAI_API_KEY` is missing, the API returns a mock response and does not break the app.
- If OpenAI returns an error, the API stores usage with fallback metadata and returns a friendly mock response.
- Supported generation types: `campaign_message`, `product_offer`, `follow_up`, `auto_reply`, `bangla_english_rewrite`, and `short_professional_rewrite`.
- Safety rules instruct the model to avoid spammy or misleading content, respect STOP/opt-out, keep messages short and professional, and support English, Bangla, and Banglish.

## 17. WhatsApp Cloud API Sandbox Setup

Set these values in `.env`:

```env
WHATSAPP_ACCESS_TOKEN="your_meta_access_token"
WHATSAPP_PHONE_NUMBER_ID="your_phone_number_id"
WHATSAPP_BUSINESS_ACCOUNT_ID="your_waba_id"
WHATSAPP_VERIFY_TOKEN="choose_a_webhook_verify_token"
WHATSAPP_APP_SECRET="your_meta_app_secret"
WHATSAPP_API_VERSION="v21.0"
```

Webhook endpoint:

```text
/api/webhooks/whatsapp
```

Behavior:

- GET verifies Meta's webhook challenge using `WHATSAPP_VERIFY_TOKEN`.
- POST validates `X-Hub-Signature-256` when `WHATSAPP_APP_SECRET` is configured.
- Raw payloads are stored in `WebhookEvent`.
- Incoming messages create/update conversations and message logs.
- Status events update message logs when provider message IDs match.
- STOP/unsubscribe/cancel/opt-out messages mark contacts as `doNotContact` and `optedIn=false`.
- Campaign and test sends use Cloud API only when `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` are configured; otherwise they use mock fallback.

## 18. Stabilization Pass - 2026-05-25

Reviewed the app against `END_TO_END_TESTING_GUIDE.md` with focus on safety, fallback behavior, API consistency, and TypeScript correctness.

Fixes made:

- Stabilized `useToast` with a memoized callback so components that depend on `showToast` do not refetch unnecessarily.
- Preserved `doNotContact`/unsubscribe state during contact imports so re-importing a phone number does not silently re-enable campaign sends.
- Preserved `doNotContact` behavior in WhatsApp test-send so unsubscribed contacts stay blocked.
- Hardened OpenAI response parsing in `/api/ai/generate-message`; if OpenAI returns a non-standard body, the route returns a safe fallback message instead of crashing.

Verification:

- `npm.cmd run build` passed after the stabilization fixes.
- Workspace-scoped API routes continue to use `getCurrentAuthContext`; WhatsApp webhook routes intentionally use default workspace handling because Meta callbacks cannot carry the browser demo session cookie.
- Add robust error handling for WhatsApp API failures, expired tokens, and webhook retries.

## 19. Authentication And Roles Hardening - 2026-05-25

Implemented local MVP auth hardening while preserving the existing demo login.

Changes made:

- Added bcrypt password hashing through `bcryptjs`.
- Updated the SQLite initializer so `admin@arbcore.ai` stores a bcrypt hash for `demo1234`.
- Updated login to verify the stored hash instead of checking a plain-text password.
- Added Prisma `UserRole` enum values: `OWNER`, `ADMIN`, `MANAGER`, `AGENT`.
- Added `User.isActive` for local team member status.
- Added reusable role/module helpers in `lib/auth.ts`.
- Added company-scoped Team APIs: `GET /api/team`, `POST /api/team`, `PUT /api/team/[id]`, and `PATCH /api/team/[id]/deactivate`.
- Added a Settings Team Members section for listing users, creating demo team members, changing roles, and deactivating users.

Role policy:

- `OWNER` and `ADMIN` can access all modules.
- `MANAGER` can access Dashboard, Contacts, Campaigns, Inbox, CRM, and Analytics.
- `AGENT` can access Inbox, Contacts, and CRM.

Production notes:

- Current auth remains local demo cookie auth.
- Production OAuth, invite emails, password reset, MFA, and full session management are not added yet.

## 20. npm Audit Review - 2026-05-25

Ran `npm.cmd audit` after the authentication hardening dependency updates.

Result:

- `npm audit` reported `found 0 vulnerabilities`.
- No vulnerable packages were listed.
- No production runtime or development tooling exposure was identified from the current lockfile.
- No dependency updates were needed.

Safety decision:

- Did not run `npm audit fix --force`.
- Did not change dependency versions because the audit is clean.

## 21. Deployment Preparation - 2026-05-26

Prepared deployment documentation and a platform health endpoint while keeping the local SQLite MVP workflow unchanged.

Changes made:

- Added `GET /api/health`.
- Added `DEPLOYMENT_CHECKLIST.md`.
- Added `SESSION_SECRET` to `.env.example`.
- Updated `README.md` with Vercel and Railway deployment notes.
- Documented production build/start commands: `npm run build` and `npm run start`.

Health check response includes:

- App name and status.
- Database status from a lightweight Prisma `SELECT 1` query.
- Environment mode from `NODE_ENV`.
- AI configured status based on `OPENAI_API_KEY`.
- WhatsApp configured status based on `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID`.
- Current timestamp.

Production environment checklist:

- `DATABASE_URL`
- `DIRECT_URL`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_BUSINESS_ACCOUNT_ID`
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_APP_SECRET`
- `WHATSAPP_API_VERSION`
- `SESSION_SECRET`

Security notes:

- Never commit `.env`.
- Rotate API keys if exposed.
- Use HTTPS in production.
- Set Meta webhook URL to `https://YOUR_DOMAIN/api/webhooks/whatsapp`.
- Use PostgreSQL in production.
- Enable database backups.
- Keep `SESSION_SECRET` secure and rotate it if exposed.
