# Auth And Workspace Hardening Plan

## 1. Current Auth Status

ARBCore SwiftConnect currently uses a demo-cookie auth flow for beta operation. `getCurrentAuthContext()` checks the demo session cookie and then returns the default workspace through `ensureDefaultWorkspace()`.

This is acceptable for the current single-company Enterprise Beta, but it is not enough for onboarding external client businesses.

Current behavior:

- Demo login route exists.
- Demo logout route exists.
- `/api/auth/me` returns the current demo auth context.
- The default user is seeded as `OWNER`.
- Auth is not yet backed by Supabase Auth, NextAuth, or a production identity provider.
- There is no real user invite/password reset/session lifecycle yet.

## 2. Current Company / Workspace Selection Behavior

Current selection is single-company oriented:

- `ensureDefaultWorkspace()` creates or updates the default company and default owner user.
- Most authenticated APIs call `getCurrentAuthContext()` and scope queries by `context.company.id`.
- Some unauthenticated/provider paths use the default or first company behavior for beta webhook handling.
- `lib/current-company.ts` now centralizes the current beta company lookup while preserving existing behavior.

Important limitation: before external clients are added, company selection must come from the authenticated user session or provider-specific webhook routing, not simply the default/first company.

## 3. Current Roles / Team Behavior

The Prisma schema has a `User` model and `UserRole` enum:

- `OWNER`
- `ADMIN`
- `MANAGER`
- `AGENT`

Team members are stored as real `User` records linked to `companyId`, but the current app still operates through the demo owner session. Team routes already enforce `OWNER`/`ADMIN` checks for team management.

Recommended future role addition:

- `VIEWER`

`VIEWER` should be added only through a future schema migration when real auth and role enforcement are being implemented.

## 4. Current Data Isolation Risks

Current risks before multi-client SaaS rollout:

- Demo auth always resolves the default workspace.
- Settings API was historically first-company based; it now uses `getCurrentCompany()` but still preserves beta behavior.
- WhatsApp webhook routing currently resolves to the beta/default company. It needs explicit phone-number/webhook routing before multiple companies share provider callbacks.
- Some global uniqueness rules, such as contact phone and user email, may need tenant-aware review before multi-client onboarding.
- Access token storage is company-level and masked in UI, but provider credentials need stricter role protection after real auth.
- Billing/license enforcement is not active.

## 5. API Routes That Need Company Scoping Review

Routes already using authenticated company scoping:

- `/api/dashboard/statistics`
- `/api/contacts`
- `/api/contacts/[id]`
- `/api/contacts/import`
- `/api/auto-reply/rules`
- `/api/auto-reply/rules/[id]`
- `/api/team`
- `/api/team/[id]`
- `/api/team/[id]/deactivate`
- `/api/whatsapp/test-send`
- `/api/whatsapp/logs`
- `/api/messages/logs`
- `/api/campaigns`
- `/api/conversations`
- `/api/crm/pipeline`
- `/api/templates`
- `/api/analytics/summary`
- `/api/ai/generate-message`

Routes needing special future hardening:

- `/api/settings/company`: should use authenticated user/company after real auth is active.
- `/api/whatsapp/webhook`: should route by Meta phone number ID or provider account mapping.
- `/api/webhooks/whatsapp`: legacy/alternate webhook path should be reviewed or retired.
- Future `/api/messenger/webhook`: must route by Page ID and company mapping.
- Future billing/payment webhooks: must verify gateway signatures and company/subscription mapping.

## 6. Recommended Future Auth Provider

Recommended choices:

- Supabase Auth: strong fit with Supabase PostgreSQL and hosted auth flows.
- NextAuth: flexible if custom providers and session strategies are needed.

Choose one before onboarding external clients. Do not keep demo-cookie auth for paid SaaS access.

## 7. Recommended Roles

Future roles:

- `OWNER`: full workspace, billing, settings, team, and provider credential control.
- `ADMIN`: operational admin access except ownership transfer.
- `MANAGER`: contacts, campaigns, CRM, auto replies, and message operations.
- `AGENT`: contacts, inbox/send messages, CRM follow-up.
- `VIEWER`: read-only dashboards, logs, and basic records.

## 8. Required Permissions By Module

| Module | OWNER | ADMIN | MANAGER | AGENT | VIEWER |
| --- | --- | --- | --- | --- | --- |
| Dashboard | Read | Read | Read | Read | Read |
| Contacts | Full | Full | Full | Create/Edit | Read |
| Send Messages | Full | Full | Full | Send | No send |
| Auto Reply | Full | Full | Manage | Read or limited | Read |
| WhatsApp Logs | Full | Full | Read | Read | Read |
| Settings | Full | Full | Limited | No access | No access |
| Team | Full | Manage | No access | No access | No access |
| License/Billing | Full | Read/Manage | Read | No access | No access |

## 9. Recommended Phased Implementation

### Phase 1: Keep Single-Company Beta Stable

- Preserve current WhatsApp send, webhook, logs, and auto reply.
- Keep Welzz Stride operational.
- Add docs and helper scaffolding only.

### Phase 2: Add Real Login / Session

- Choose Supabase Auth or NextAuth.
- Replace demo-cookie sessions.
- Add production login/logout and session refresh.
- Keep existing default owner as first admin.

### Phase 3: Bind User To Company

- Resolve active company from authenticated user.
- Support users linked to one company first.
- Add workspace switching later only if needed.

### Phase 4: Enforce Company ID In All API Routes

- Audit every route.
- Require `companyId` for all workspace data.
- Remove first-company fallback from authenticated routes.
- Add provider-specific webhook routing for external callbacks.

### Phase 5: Add Role Permission Checks

- Convert route-level access from informal patterns to shared permission helpers.
- Add `VIEWER` through migration if needed.
- Protect Settings, Team, Billing, and provider credentials.

### Phase 6: Invite Client Users / Team Members

- Add invite flow.
- Add password setup/reset.
- Add active/inactive user handling through real auth.
- Keep duplicate email handling friendly.

### Phase 7: Billing / License Enforcement

- Add subscription entities.
- Start with manual activation.
- Add gateway confirmation later.
- Enforce limits gradually after paid workflow is proven.

## 10. Current Pass Summary

This pass does not implement full auth or billing. It adds:

- `lib/current-company.ts` to centralize current beta company lookup.
- `lib/permissions.ts` as a future permission map stub.
- Documentation for current auth/workspace behavior and SaaS hardening phases.
- Small License page clarity for single-company beta vs future multi-client SaaS.

No schema migration was added in this pass.
