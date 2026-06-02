# ARBCore SwiftConnect Production Manual QA Checklist

## Build

- [ ] `git status` reviewed.
- [ ] `npx prisma generate` passes.
- [ ] `npm.cmd run build` passes.
- [ ] No TypeScript errors.
- [ ] No Prisma generation errors.
- [ ] No secrets are present in committed files.

## Vercel

- [ ] Latest production deployment is Ready.
- [ ] Production URL loads over HTTPS.
- [ ] Deployment uses the expected latest commit.
- [ ] Required environment variables are configured.
- [ ] `/api/health` responds successfully if available.

## Supabase

- [ ] `DATABASE_URL` is configured.
- [ ] `DIRECT_URL` is configured.
- [ ] Migrations are applied safely.
- [ ] Production database has not been reset.
- [ ] Key tables exist: `Company`, `User`, `Contact`, `MessageLog`, `ConversationState`, `AutoReplyRule`, `WebhookEvent`.

## Auth

- [ ] `/login` loads.
- [ ] `/auth/status` loads.
- [ ] `/auth/permissions` loads.
- [ ] `/api/auth/me` returns safe JSON only.
- [ ] `/api/auth/permissions` returns safe JSON only.
- [ ] `AUTH_ENFORCED=false` for current production beta unless deliberately testing.
- [ ] `PERMISSIONS_ENFORCED=false` for current production beta unless deliberately testing.
- [ ] No tokens, cookies, raw sessions, or service role keys are displayed.

## Settings

- [ ] Business Profile saves and persists.
- [ ] WhatsApp/API Settings save and persist.
- [ ] WhatsApp Access Token stays hidden after refresh.
- [ ] Messenger/Page API Settings save and persist.
- [ ] Messenger Page Access Token stays hidden after refresh.
- [ ] Team duplicate email shows a friendly message.

## Channel Center

- [ ] `/channels` loads.
- [ ] WhatsApp status is shown.
- [ ] Messenger status is shown.
- [ ] Diagnostics load.
- [ ] Webhook copy helpers show safe URLs only.
- [ ] Missing setup items show field names only.
- [ ] Tokens are not displayed.

## WhatsApp

- [ ] `/api/whatsapp/webhook` builds and is reachable for Meta verification.
- [ ] Meta callback URL is correct.
- [ ] Verify Token matches ARBCore Settings.
- [ ] `messages` subscription is enabled.
- [ ] Send Messages does not fake success.
- [ ] Successful provider send logs `SENT`.
- [ ] Provider error logs `FAILED`.
- [ ] Inbound webhook logs `RECEIVED`.
- [ ] Auto Reply logs outbound `SENT` only after Meta accepts it.

## Messenger

- [ ] `/api/messenger/webhook` builds and is reachable for Meta verification.
- [ ] Meta callback URL is correct.
- [ ] Verify Token matches ARBCore Settings.
- [ ] `messages` subscription is enabled.
- [ ] Messenger test-send uses PSID, not phone number.
- [ ] Messenger does not fake success.
- [ ] Successful provider send logs `SENT`.
- [ ] Provider error logs `FAILED`.
- [ ] Inbound webhook logs `MESSENGER / INBOUND / RECEIVED`.

## Inbox

- [ ] `/inbox` loads.
- [ ] Conversation list loads.
- [ ] Selecting a conversation shows detail.
- [ ] Reply composer appears.
- [ ] Status update saves.
- [ ] Assignment saves.
- [ ] Contact linking works for WhatsApp contacts.
- [ ] Internal note saves and reloads.
- [ ] Follow-up reminder saves and reloads.
- [ ] Internal notes are not sent to customers.

## Contacts

- [ ] `/contacts` loads.
- [ ] Contact create works.
- [ ] Contact edit works.
- [ ] Contact delete/deactivate works.
- [ ] Duplicate phone shows a friendly error.
- [ ] Search and filters work.

## Auto Reply

- [ ] `/auto-reply` loads.
- [ ] Rule create works.
- [ ] Rule edit works.
- [ ] Rule activate/deactivate works.
- [ ] Rule delete works.
- [ ] Live keyword match works for configured channels.
- [ ] Provider failures log `FAILED`.

## Message Logs

- [ ] `/message-logs` loads.
- [ ] `/whatsapp-logs` still loads.
- [ ] Channel filter works.
- [ ] Direction filter works.
- [ ] Status filter works.
- [ ] Search works.
- [ ] WhatsApp logs appear when data exists.
- [ ] Messenger logs appear when data exists.
- [ ] `SENT`, `FAILED`, and `RECEIVED` are visible when relevant.
- [ ] No raw tokens or secrets are shown.

## Dashboard

- [ ] `/dashboard` loads.
- [ ] CRM/support metrics render.
- [ ] Support Inbox Overview renders.
- [ ] Follow-up Overview renders.
- [ ] Message Health renders.
- [ ] Channel Activity renders.
- [ ] Quick links open Inbox, Message Logs, and Channel Center.

## License

- [ ] `/license` loads.
- [ ] Enterprise Beta status is clear.
- [ ] Billing/license enforcement is not accidentally enabled.

## Security

- [ ] No access token is displayed.
- [ ] No Page Access Token is displayed.
- [ ] No raw webhook payload with customer-sensitive data is exposed.
- [ ] No raw Supabase session or cookie is shown.
- [ ] No secret values are committed.
- [ ] Success is not claimed unless Message Logs show `SENT`.

## Rollback

- [ ] Previous Vercel deployment is known.
- [ ] Latest working commit is known.
- [ ] Rollback does not reset production DB.
- [ ] `AUTH_ENFORCED=false` after rollback.
- [ ] `PERMISSIONS_ENFORCED=false` after rollback.
- [ ] Critical pages are re-tested after rollback.
