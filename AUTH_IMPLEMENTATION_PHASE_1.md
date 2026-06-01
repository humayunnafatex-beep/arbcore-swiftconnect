# Auth Implementation Phase 1

## 1. Goal Of Phase 1

Phase 1 prepares ARBCore SwiftConnect for real authentication without disrupting the current single-company Enterprise Beta.

This phase adds documentation, route classification, and non-breaking helper stubs. Phase 2 adds Supabase Auth client/server helpers and login UI. Phase 3 adds an `AUTH_ENFORCED` route protection flag, but the flag defaults off.

## 2. Why Login Is Not Enforced Yet

WhatsApp outbound send, inbound webhook receive, WhatsApp Logs, and live Auto Reply are already working. Enforcing a new login/session system too quickly could break production beta workflows.

For this reason:

- Current demo-cookie behavior remains available.
- Pages are not newly blocked by real auth enforcement in this phase.
- Existing API behavior is not broadly rewritten.
- Webhook routes remain public but verified.
- Real auth enforcement is deferred to Phase 2 and later.

## 3. Current Demo-Cookie Behavior

Current auth behavior:

- Demo cookie name: `arbcore_demo_session`.
- Demo session value: `arbcore-local-demo-session`.
- Demo owner email: `admin@arbcore.ai`.
- `ensureDefaultWorkspace()` creates or updates the default company and default owner.
- `getCurrentAuthContext()` still checks for the demo cookie and returns the default workspace context.
- `getCurrentUser()`, `getCurrentUserRole()`, and `requireCurrentUser()` are Phase 1 helper stubs that return the current beta/default owner without enforcing real login.
- `isAuthEnforced()` returns `false` for now.
- Phase 3 updates `isAuthEnforced()` to read `AUTH_ENFORCED`, returning true only when the value is exactly `true`.
- Phase 2 adds Supabase session lookup first; if no mapped Supabase user exists and auth is not enforced, the beta/default owner fallback remains.

## 4. Recommended Future Provider

Recommended provider: Supabase Auth.

Reason:

- The project already uses Supabase PostgreSQL.
- Supabase Auth is a natural fit for user sessions and workspace membership.
- Future Next.js App Router auth should use secure cookie-based server-side session handling.

NextAuth remains a possible alternative if the product later needs custom auth providers or a different session strategy.

## 5. Future Auth Flow

Target flow:

1. User opens the app.
2. User logs in with Supabase Auth.
3. Secure session cookie exists.
4. Server reads the current authenticated user.
5. Auth user maps to an ARBCore `User` record.
6. User maps to one or more `Company` / workspace memberships.
7. APIs use `companyId` from the authenticated session/company membership.
8. Role permissions decide which modules and actions are allowed.

## 6. Public Routes That Must Stay Accessible

These routes must remain publicly reachable by Meta providers, while still using token/signature verification:

```text
/api/whatsapp/webhook
/api/webhooks/whatsapp
```

Future public provider route:

```text
/api/messenger/webhook
```

These routes should not require a browser login session because Meta must be able to call them.

## 7. Future Protected Routes

Future protected app routes:

```text
/dashboard
/contacts
/send-messages
/auto-reply
/whatsapp-logs
/settings
/license
```

Future protected API prefixes:

```text
/api/contacts
/api/auto-reply
/api/settings
/api/team
/api/whatsapp/logs
/api/whatsapp/test-send
/api/dashboard
```

Phase 1 exports these classifications in `lib/auth-routes.ts` but does not enforce them yet.

## 8. Current Company And Workspace Resolution

Current beta behavior:

- `lib/current-company.ts` returns the first/default company.
- If no company exists, it creates the default workspace through `ensureDefaultWorkspace()`.
- This keeps Welzz Stride / single-company beta behavior stable.

Future SaaS behavior:

- Company should resolve from authenticated user/session membership.
- Provider webhooks should resolve company from provider identifiers, such as WhatsApp Phone Number ID or Messenger Page ID.
- First-company fallback must be removed before external client onboarding.

## 9. Migration Phases

### Phase 1: Foundation Only

- Add auth helper stubs.
- Add route classification helper.
- Document current auth/workspace risks.
- Keep current beta behavior stable.

### Phase 2: Login Page And Session Helper

- Add Supabase Auth client/server helpers.
- Add `/auth/callback` for Supabase redirect flows.
- Add `/auth/logout` for Supabase sign-out plus beta cookie cleanup.
- Prepare `/login` for Supabase email/password and magic link.
- Keep demo fallback because auth enforcement is still off in Phase 2.

### Phase 3: Protect Pages

- Add controlled route protection through `AUTH_ENFORCED`.
- Protect Dashboard, Contacts, Send Messages, Auto Reply, WhatsApp Logs, Settings, and License only when the flag is true.
- Keep provider webhook routes public.

### Phase 4: Enforce API Company Scoping

- Require authenticated company context for protected APIs.
- Remove default-company fallback from authenticated routes.
- Route webhooks by provider account identifiers.

### Phase 5: Role Permissions

- Enforce `OWNER`, `ADMIN`, `MANAGER`, `AGENT`, and future `VIEWER` permissions.
- Protect Settings, Team, and Billing more strictly.

### Phase 6: Client Onboarding / Invites

- Add invite flow.
- Add password setup/reset.
- Add workspace-specific user onboarding.
- Add billing/license activation when ready.

## 10. Phase 1 Safety Rules

- Do not expose access tokens.
- Do not block working WhatsApp flows.
- Do not fake authentication completion.
- Do not enforce billing.
- Do not break public Meta webhook routes.
- Keep this phase reversible and low risk.
