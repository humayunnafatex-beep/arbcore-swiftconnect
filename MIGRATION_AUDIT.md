# Migration Audit

This audit summarizes the current Prisma migration history for ARBCore SwiftConnect Enterprise Beta.

## Migration Order

1. `20260526134103_init_postgres`
   - Creates the initial PostgreSQL schema, enums, company/user/contact/campaign/conversation/message log/webhook/auto-reply/CRM/AI tables, indexes, and relations.
   - Manual note: initial baseline migration.

2. `20260528222314_add_company_settings`
   - Adds company settings fields for language, notifications, phone, timezone, and website.
   - Manual note: safe additive company fields.

3. `20260529023611_add_company_profile_fields`
   - Adds company `businessName` and `workspaceName`.
   - Manual note: safe additive company profile fields.

4. `20260530155714_add_whatsapp_api_settings`
   - Adds WhatsApp Phone Number ID, Access Token, Verify Token, and Webhook URL fields to `Company`.
   - Manual note: token field is stored server-side and should never be displayed after refresh.

5. `20260601120000_add_supabase_auth_id_to_user`
   - Adds nullable `supabaseAuthId` to `User` and a unique index for Supabase Auth mapping.
   - Manual note: auth enforcement remains disabled by default.

6. `20260601120456_add_messenger_settings`
   - Adds Messenger Page settings to `Company`.
   - Adds `channel` to `MessageLog` with default `WHATSAPP`.
   - Manual note: Page Access Token must remain private.

7. `20260601170942_add_conversation_state`
   - Adds `ConversationState` for Inbox status and assignment by company/channel/contact key.
   - Manual note: safe additive support workflow table.

8. `20260601173027_add_conversation_notes_followup`
   - Adds `internalNote`, `followUpAt`, and `followUpDone` to `ConversationState`.
   - Manual note: notes are internal CRM data only and are never written to `MessageLog`.

9. `20260602064058_add_manual_subscription_payments`
   - Adds manual subscription and payment tracking tables/fields for beta billing.
   - Manual note: payment gateway automation is not active; manual records must not store card data.

10. `20260602072838_add_campaign_drafts`
    - Adds campaign draft workflow fields and related enum values.
    - Manual note: campaign sending remains disabled/safe; draft and status data only.

11. `20260602075716_add_campaign_audience_criteria`
    - Adds campaign audience criteria support for previewing selected contacts.
    - Manual note: audience preview must not send or broadcast messages.

## Production Deployment Cautions

- Run `npx prisma generate` after schema changes.
- Ensure pending migrations are applied to Supabase with the production migration process.
- Never run `prisma migrate reset` against production.
- Confirm `DATABASE_URL` and `DIRECT_URL` point to the intended Supabase database before applying migrations.
- Use `SUPABASE_DB_CONNECTION_GUIDE.md` to confirm `DATABASE_URL` is suitable for app/runtime use and `DIRECT_URL` is a direct migration connection.
- A `DIRECT_URL` that appears pooled is a migration readiness warning. Do not run production migrations until it is reviewed.
- Complete `PRODUCTION_MIGRATION_READINESS_CHECKLIST.md` before applying Prisma migrations to Supabase production.
- Keep a database backup before production migration deployment.
- Never reset the production database.
- Token columns store sensitive values; do not inspect or export them into screenshots, tickets, or docs.
