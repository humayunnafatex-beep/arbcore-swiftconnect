# Auth Enforcement Test Checklist

Use this checklist before any local, staging, or production `AUTH_ENFORCED=true` test.

## 1. Default Beta Mode: `AUTH_ENFORCED=false`

- [ ] Set `AUTH_ENFORCED=false`.
- [ ] Start or deploy the app.
- [ ] Confirm `/dashboard` loads without forced login.
- [ ] Confirm `/contacts` loads.
- [ ] Confirm `/send-messages` loads.
- [ ] Confirm `/auto-reply` loads.
- [ ] Confirm `/whatsapp-logs` loads.
- [ ] Confirm `/settings` loads.
- [ ] Confirm `/license` loads.
- [ ] Confirm `/auth/status` loads.
- [ ] Confirm `/api/auth/me` returns safe JSON.
- [ ] Confirm no token, cookie, raw session, or service-role key is displayed.

## 2. Enforced Mode: `AUTH_ENFORCED=true`

- [ ] Use local or staging first.
- [ ] Confirm Supabase env vars are configured.
- [ ] Confirm `/auth/status` shows `mode = supabase_mapped` before production enforcement.
- [ ] Set `AUTH_ENFORCED=true`.
- [ ] Restart or redeploy.

## 3. Login Redirect Test

- [ ] Visit `/dashboard` while logged out.
- [ ] Confirm redirect to `/login`.
- [ ] Visit `/contacts` while logged out.
- [ ] Confirm redirect to `/login`.
- [ ] Visit `/settings` while logged out.
- [ ] Confirm redirect to `/login`.
- [ ] Confirm `/login` does not redirect-loop.

## 4. Login Test

- [ ] Log in at `/login` with the mapped Supabase Auth admin user.
- [ ] Confirm login succeeds.
- [ ] Confirm Dashboard loads.
- [ ] Confirm browser refresh keeps the session through Supabase SSR cookies.

## 5. Auth Status Mapping Test

- [ ] Open `/auth/status`.
- [ ] Confirm Supabase user detected is `Yes`.
- [ ] Confirm Prisma user mapped is `Yes`.
- [ ] Confirm role is `OWNER` or `ADMIN`.
- [ ] Confirm company exists.
- [ ] Confirm mode is `supabase_mapped`.
- [ ] Confirm the page says it is safe to test `AUTH_ENFORCED=true` in local or staging.

## 6. Protected Pages Test

- [ ] `/dashboard` loads after login.
- [ ] `/contacts` loads after login.
- [ ] `/send-messages` loads after login.
- [ ] `/auto-reply` loads after login.
- [ ] `/whatsapp-logs` loads after login.
- [ ] `/settings` loads after login.
- [ ] `/license` loads after login.

## 7. Logout Test

- [ ] Open `/auth/logout`.
- [ ] Confirm logout redirects to `/login` or the configured safe page.
- [ ] Visit `/dashboard` again.
- [ ] Confirm protected routes redirect to `/login`.

## 8. Public Webhook Test

- [ ] Test `GET /api/whatsapp/webhook` with valid verify params.
- [ ] Confirm valid webhook verification returns the expected challenge.
- [ ] Test `GET /api/whatsapp/webhook` with wrong verify token.
- [ ] Confirm invalid verification fails safely.
- [ ] If safe, test `POST /api/whatsapp/webhook` with a sample Meta payload.
- [ ] Confirm the POST route returns safely and does not require app login.
- [ ] Confirm `/api/webhooks/whatsapp` remains public if used.

## 9. No-Token-Exposed Test

- [ ] `/auth/status` does not display Supabase tokens.
- [ ] `/api/auth/me` does not return cookies.
- [ ] `/api/auth/me` does not return raw Supabase sessions.
- [ ] `/api/auth/me` does not return service-role keys.
- [ ] WhatsApp access tokens are still hidden after Settings refresh.

## 10. Rollback Test

- [ ] Set `AUTH_ENFORCED=false`.
- [ ] Restart or redeploy.
- [ ] Confirm `/dashboard` loads in beta fallback mode when logged out.
- [ ] Confirm `/auth/status` can show `beta_fallback` when no Supabase user is detected.
- [ ] Confirm WhatsApp webhook, Send Messages, WhatsApp Logs, Auto Reply, Settings, and Contacts still work.
