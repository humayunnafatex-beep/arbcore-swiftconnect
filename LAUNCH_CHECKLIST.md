# ARBCore SwiftConnect Launch Checklist

Use this checklist before each production launch or rollback.

For live Meta WhatsApp Cloud API setup, follow `META_WHATSAPP_SETUP_GUIDE.md` before running outbound or inbound production tests.

## 1. Environment Variables

- [ ] `DATABASE_URL` is set to the production pooled PostgreSQL URL.
- [ ] `DIRECT_URL` is set to the direct PostgreSQL migration URL.
- [ ] `SESSION_SECRET` is long, random, private, and stored only in platform secrets.
- [ ] `NEXT_PUBLIC_APP_URL` matches the production domain.
- [ ] `OPENAI_API_KEY` is blank for beta fallback mode or set only in server secrets.
- [ ] `WHATSAPP_ACCESS_TOKEN` is set only when real WhatsApp sending is approved.
- [ ] `WHATSAPP_PHONE_NUMBER_ID` matches the Meta phone number.
- [ ] `WHATSAPP_VERIFY_TOKEN` matches the token configured in Meta webhooks, or the saved Settings verify token is used.
- [ ] `WHATSAPP_APP_SECRET` is set before trusting webhook signatures.
- [ ] No real values are committed to Git.

## 2. Vercel Deployment

- [ ] Latest `main` commit is pushed.
- [ ] Vercel build is successful.
- [ ] Production deployment is Ready.
- [ ] `/api/health` returns success.
- [ ] Production domain uses HTTPS.

## 3. Supabase Migration

- [ ] Supabase project is healthy.
- [ ] Database backups are enabled.
- [ ] `npx prisma migrate deploy` has run for pending migrations.
- [ ] `npx prisma generate` has run after schema changes.
- [ ] Basic record counts look correct after deploy.

## 4. Settings QA

- [ ] Business Profile saves and persists after refresh.
- [ ] WhatsApp/API settings save and persist after refresh.
- [ ] Saved access token is not returned or displayed after refresh.
- [ ] Team duplicate email returns a friendly error.

## 5. Contacts QA

- [ ] Contact create works.
- [ ] Contact edit works.
- [ ] Contact delete asks for confirmation and works.
- [ ] Duplicate phone returns a friendly error.
- [ ] Search and filters still work.

## 6. Auto Reply QA

- [ ] Rule create works.
- [ ] Rule edit works.
- [ ] Rule deactivate asks for confirmation.
- [ ] Rule activate works.
- [ ] Rule delete asks for confirmation and works.

## 7. Send Messages QA

- [ ] Phone and message are required.
- [ ] Missing WhatsApp Cloud API shows: `WhatsApp Cloud API is required to send real messages.`
- [ ] The app does not claim success unless the provider accepts the send.
- [ ] Message attempts are logged without exposing secrets.
- [ ] Provider errors show a friendly message and never include the access token.

## 8. Dashboard QA

- [ ] Dashboard loads without visible errors.
- [ ] Contacts, messages, conversations, auto replies, campaigns, and team counts load.
- [ ] Empty or low-data workspaces still render cleanly.

## 9. WhatsApp Cloud API QA

- [ ] `META_WHATSAPP_SETUP_GUIDE.md` has been reviewed for the current production domain.
- [ ] Meta phone number ID is correct.
- [ ] Access token is valid and stored only in protected settings or platform secrets.
- [ ] Webhook verify token matches Meta.
- [ ] Meta callback URL is `https://YOUR_DOMAIN/api/whatsapp/webhook`.
- [ ] Webhook GET verification succeeds with the correct verify token.
- [ ] Webhook GET verification fails with the wrong verify token.
- [ ] Webhook POST with a sample inbound message returns 200.
- [ ] App secret is configured before relying on signature validation.
- [ ] Test send succeeds only after provider success.
- [ ] Send Messages shows one of the safe states: `not_configured`, `validation_failed`, `provider_error`, or `sent_successfully`.
- [ ] Inbound message logging is verified with a real Meta callback.

## 10. Known Limitations

- Billing/license enforcement is not active in beta.
- Demo cookie auth remains in place until production auth is implemented.
- Real WhatsApp sending requires Meta Cloud API credentials and webhook readiness.
- Campaign sending requires approved templates and a completed production send workflow.
- Saved access tokens are intentionally hidden after refresh.

## 11. Rollback Notes

- [ ] Identify the last known good Git commit.
- [ ] Re-deploy the previous Vercel deployment or push a revert commit.
- [ ] Do not roll back database migrations without a tested migration rollback plan.
- [ ] Re-check `/api/health`, Settings, Contacts, Auto Reply, Send Messages, and Dashboard after rollback.
