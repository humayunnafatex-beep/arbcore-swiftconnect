# Supabase Production Migration Checklist

## Purpose

Use this checklist to safely confirm all Prisma migrations are applied to Supabase production for ARBCore SwiftConnect.

This checklist is verification-focused. It must not be used to reset or destructively modify production data.

## Safety Warnings

- Never reset the production database.
- Never run `prisma migrate reset` against production.
- Never run destructive SQL without a reviewed rollback plan.
- Backup or export production data before risky changes.
- Confirm `DATABASE_URL` and `DIRECT_URL` point to the intended production Supabase database before running deployment migration commands.
- Keep `AUTH_ENFORCED=false` and `PERMISSIONS_ENFORCED=false` unless a controlled staging test has already passed.
- Do not expose database URLs, access tokens, service role keys, or direct connection strings in screenshots or docs.

## Migration Review

Before production verification, review:

```text
MIGRATION_AUDIT.md
```

Latest key migration areas to confirm:

- Conversation state
- Inbox notes and follow-up reminders
- Messenger settings
- Manual subscription and payment records
- Billing summary and receipt support
- Report-only plan usage support
- Campaign drafts
- Campaign audience criteria

Recent migration folders should include the production changes for:

- `ConversationState`
- `WebhookEvent` and message logs where applicable
- Messenger/Page API settings on `Company`
- `Subscription`
- `PaymentRecord`
- Campaign draft fields
- Campaign audience criteria fields

## Verification Steps

1. Confirm the app is on branch `main`.
2. Confirm the working tree is clean.
3. Run:

```powershell
npx prisma generate
```

4. Confirm Prisma Client generation passes.
5. Review pending migrations locally before deployment.
6. Confirm Vercel environment variables are present:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - Supabase Auth public values if login testing is needed
   - Meta channel settings only in protected environment/settings storage
7. Confirm migrations are applied safely in production deployment flow.
8. Check Supabase tables exist:
   - `Company`
   - `User`
   - `Contact`
   - `MessageLog`
   - `ConversationState`
   - `AutoReplyRule`
   - `WebhookEvent`
   - `Subscription`
   - `PaymentRecord`
   - `Campaign`
9. Confirm Vercel deployment is Ready.
10. Run the read-only production verification script:

```powershell
$env:PRODUCTION_URL="https://arbcore-swiftconnect.vercel.app"
npm.cmd run verify:production
```

11. Confirm these production pages load:
   - `/dashboard`
   - `/channels`
   - `/inbox`
   - `/message-logs`
   - `/contacts`
   - `/auto-reply`
   - `/campaigns`
   - `/billing`
   - `/settings`
12. Confirm safe APIs return data without secrets:
   - `/api/dashboard/statistics`
   - `/api/channels/status`
   - `/api/channels/diagnostics`
   - `/api/inbox/conversations`
   - `/api/whatsapp/logs`
   - `/api/billing/summary`
   - `/api/billing/usage`
   - `/api/auth/me`
   - `/api/auth/permissions`

## Rollback Notes

If production deployment fails:

1. Revert Vercel to the previous Ready deployment.
2. Do not reset the database.
3. Do not roll back production migrations unless a reviewed migration rollback plan exists.
4. Prefer a forward-fix migration for already-applied schema changes.
5. Restore safe environment flags:

```env
AUTH_ENFORCED=false
PERMISSIONS_ENFORCED=false
```

6. Re-run production verification after rollback or forward fix.

## Final Sign-Off

- [ ] Prisma generate passed.
- [ ] Vercel deployment is Ready.
- [ ] Supabase tables exist.
- [ ] Production verification script passes.
- [ ] Critical pages load.
- [ ] No secrets are exposed.
- [ ] No destructive command was run.
