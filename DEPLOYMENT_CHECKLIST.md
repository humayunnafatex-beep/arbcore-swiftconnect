# ARBCore SwiftConnect Deployment Checklist

Use this checklist before deploying the MVP to Vercel, Railway, or another production platform.

## Local Build Checklist

| Check | Pass/Fail | Notes |
| --- | --- | --- |
| `npm install` completed |  |  |
| `npm run prisma:generate` completed |  |  |
| `npm.cmd run build` completed |  |  |
| Login works with the demo account |  |  |
| Dashboard loads without API errors |  |  |
| `/api/health` returns app and database status |  |  |

## Environment Variables Checklist

| Variable | Required For Production | Pass/Fail | Notes |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes |  | PostgreSQL connection string in production |
| `DIRECT_URL` | Yes |  | Direct PostgreSQL connection for Prisma migrations |
| `OPENAI_API_KEY` | Optional |  | Required only for real AI Studio generation |
| `OPENAI_MODEL` | Optional |  | Example: `gpt-4o-mini` |
| `WHATSAPP_ACCESS_TOKEN` | Optional |  | Required only for WhatsApp Cloud API sends |
| `WHATSAPP_PHONE_NUMBER_ID` | Optional |  | Required for WhatsApp Cloud API sends |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | Optional |  | Required for Meta business tracking |
| `WHATSAPP_VERIFY_TOKEN` | Optional |  | Required for webhook verification |
| `WHATSAPP_APP_SECRET` | Optional |  | Required for webhook signature validation |
| `WHATSAPP_API_VERSION` | Optional |  | Example: `v21.0` |
| `SESSION_SECRET` | Yes |  | Keep private and rotate if exposed |

## Database Checklist

| Check | Pass/Fail | Notes |
| --- | --- | --- |
| PostgreSQL is provisioned for production |  |  |
| Backups are enabled |  |  |
| `DATABASE_URL` is set on the platform |  |  |
| `DIRECT_URL` is set for migrations |  |  |
| Prisma datasource provider is switched to PostgreSQL in the production migration branch |  |  |
| `npx prisma migrate deploy` is part of release flow |  |  |
| SQLite remains local-only |  |  |

## Deployment Platform Checklist

| Check | Pass/Fail | Notes |
| --- | --- | --- |
| Vercel or Railway project created |  |  |
| Build command set to `npm run build` |  |  |
| Start command set to `npm run start` where applicable |  |  |
| Node.js version is compatible with Next.js 14 |  |  |
| Environment variables are configured in platform dashboard |  |  |
| Health check path is `/api/health` |  |  |
| HTTPS domain is configured |  |  |

## WhatsApp Webhook Checklist

| Check | Pass/Fail | Notes |
| --- | --- | --- |
| Meta app uses official WhatsApp Cloud API |  |  |
| Webhook URL is `https://YOUR_DOMAIN/api/webhooks/whatsapp` |  |  |
| `WHATSAPP_VERIFY_TOKEN` matches Meta configuration |  |  |
| `WHATSAPP_APP_SECRET` is set for signature validation |  |  |
| WhatsApp `messages` events are subscribed |  |  |
| STOP/unsubscribe behavior tested |  |  |

## OpenAI Checklist

| Check | Pass/Fail | Notes |
| --- | --- | --- |
| `OPENAI_API_KEY` is stored only in platform secrets |  |  |
| `OPENAI_MODEL` is set |  |  |
| AI Studio fallback works without a key |  |  |
| Generated messages are reviewed before real customer sending |  |  |

## Security Checklist

| Check | Pass/Fail | Notes |
| --- | --- | --- |
| `.env` is never committed |  |  |
| API keys are rotated if exposed |  |  |
| HTTPS is enabled |  |  |
| PostgreSQL is used in production |  |  |
| Database backups are enabled |  |  |
| `SESSION_SECRET` is long, random, and private |  |  |
| Meta webhook URL is set to the production HTTPS URL |  |  |
| Production credentials are not used in local screenshots or logs |  |  |
| Demo auth is replaced before handling real customers |  |  |
