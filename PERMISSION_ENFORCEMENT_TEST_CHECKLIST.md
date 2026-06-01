# Permission Enforcement Test Checklist

Use this checklist for local or staging only before any production permission enforcement.

## 1. Default Beta Mode

- [ ] Set `AUTH_ENFORCED=false`.
- [ ] Set `PERMISSIONS_ENFORCED=false`.
- [ ] Confirm Dashboard loads.
- [ ] Confirm Settings loads and saves.
- [ ] Confirm Team still works for the beta owner/admin flow.
- [ ] Confirm WhatsApp Logs loads.
- [ ] Confirm Contacts create/edit/delete works.
- [ ] Confirm Auto Reply create/edit/delete works.
- [ ] Confirm Send Messages still works.
- [ ] Confirm `/auth/status` loads.
- [ ] Confirm `/auth/permissions` loads.
- [ ] Confirm no tokens, cookies, raw sessions, or service-role keys are exposed.

## 2. Enforced Local/Staging Mode

- [ ] Set `AUTH_ENFORCED=true`.
- [ ] Set `PERMISSIONS_ENFORCED=true`.
- [ ] Confirm Supabase Auth env vars are configured.
- [ ] Confirm `/auth/status` shows `supabase_mapped`.
- [ ] Confirm `/auth/permissions` shows the current role and permission list.

## 3. OWNER / ADMIN Expected Access

OWNER and ADMIN should access:

- [ ] Dashboard
- [ ] Contacts
- [ ] Send Messages
- [ ] Auto Reply
- [ ] WhatsApp Logs
- [ ] Settings
- [ ] Team
- [ ] License

## 4. AGENT Expected Access

AGENT should access:

- [ ] Dashboard
- [ ] Contacts
- [ ] Send Messages
- [ ] Auto Reply view
- [ ] WhatsApp Logs

AGENT should be denied:

- [ ] Settings manage
- [ ] Team manage
- [ ] Billing/license manage
- [ ] Auto Reply manage

## 5. MANAGER Expected Access

MANAGER should access:

- [ ] Dashboard
- [ ] Contacts
- [ ] Send Messages
- [ ] Auto Reply manage
- [ ] WhatsApp Logs
- [ ] License view

MANAGER should be denied:

- [ ] Settings manage
- [ ] Team manage
- [ ] Billing/license manage

## 6. Public Webhook Checks

- [ ] `/api/whatsapp/webhook` remains public.
- [ ] `/api/webhooks/whatsapp` remains public if present.
- [ ] Valid WhatsApp webhook verification still works.
- [ ] Webhook routes do not require app login.

## 7. No-Token-Exposed Checks

- [ ] `/auth/permissions` does not display tokens.
- [ ] `/api/auth/permissions` does not return cookies.
- [ ] `/api/auth/permissions` does not return raw sessions.
- [ ] `/api/auth/permissions` does not return service-role keys.
- [ ] WhatsApp access token remains hidden after Settings refresh.

## 8. Rollback Test

- [ ] Set `PERMISSIONS_ENFORCED=false`.
- [ ] Set `AUTH_ENFORCED=false`.
- [ ] Redeploy or restart.
- [ ] Confirm Dashboard loads without forced login.
- [ ] Confirm guarded APIs return to normal beta behavior.
