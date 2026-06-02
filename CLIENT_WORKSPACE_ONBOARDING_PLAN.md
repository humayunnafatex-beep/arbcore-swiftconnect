# Client Workspace Onboarding Plan

## Purpose

This plan defines the safe path for onboarding client/company workspaces into ARBCore SwiftConnect without breaking the current Welzz Stride Enterprise Beta workspace.

The goal of Phase 1 is to create and track workspace records safely. It does not enable full multi-tenant enforcement, workspace switching, billing enforcement, or automatic client access.

## Current State

- ARBCore SwiftConnect still supports the single-company beta fallback.
- Welzz Stride/current beta behavior must remain intact.
- `AUTH_ENFORCED=false` by default.
- `PERMISSIONS_ENFORCED=false` by default.
- Supabase Auth helpers, Prisma user mapping, auth status, and permission status tools exist for preparation.
- The current default company fallback still protects existing production beta workflows.
- WhatsApp and Messenger credentials are stored per company, but current provider webhook routing still needs future multi-company hardening.

## Future State

The intended SaaS model is one company/workspace per client:

- Each client has one `Company` workspace.
- Each workspace has an owner/admin `User` mapped to that company.
- Contacts, messages, settings, auto replies, inbox state, campaigns, payments, and logs are isolated by `companyId`.
- WhatsApp and Messenger credentials are configured separately per company.
- Supabase Auth users map to Prisma `User` records before route access is enforced.
- Billing/plan enforcement is introduced only after workspace mapping and tenant scoping are proven.

## Safe Onboarding Phases

### Phase 1: Admin-Assisted Workspace Records

- Use `/admin/workspaces` to list workspace records.
- Create a new `Company` with a unique slug and beta plan.
- Optionally create an owner `User` linked to that company.
- Do not copy Welzz Stride channel credentials.
- Do not switch the current session into the new workspace.
- Verify user/company mapping before giving a client real access.

### Phase 2: Admin UI For Workspace Creation

- Improve workspace creation with validation, onboarding checklist status, and audit notes.
- Keep credentials configured separately in Settings after mapping is verified.
- Add clearer admin-only access once permissions are enforced.

### Phase 3: Real Auth And Workspace Switching

- Require Supabase Auth for client users.
- Map Supabase users to Prisma users and company IDs.
- Add workspace switching only if a user can belong to multiple companies.
- Keep webhook routes public but verified.

### Phase 4: Full Company Scoping Enforcement

- Audit every API for `companyId` scoping.
- Remove first/default company fallback from authenticated app routes.
- Route WhatsApp webhooks by Phone Number ID.
- Route Messenger webhooks by Page ID.
- Confirm no client can read another client's contacts, messages, settings, billing, or logs.

### Phase 5: Billing And Plan Enforcement

- Turn report-only plan usage into controlled limits.
- Keep manual billing until gateway verification is proven.
- Enforce limits gradually and only after client access is stable.

## Risks

- Wrong company selected for a user session.
- Shared channel credentials between companies.
- Missing Supabase Auth to Prisma User mapping.
- Production migrations not applied before workspace creation.
- Webhook routing falling back to the wrong company in a future multi-client setup.
- Global unique email/phone constraints blocking clients with overlapping records.

## Rollback Notes

- Keep `AUTH_ENFORCED=false` and `PERMISSIONS_ENFORCED=false` until mapping is verified.
- Do not reset the production database.
- If a workspace is created by mistake, leave it inactive/unused until an admin decides whether to archive or remove it safely.
- Remove or deactivate incorrectly created owner users only after confirming they are not mapped to an active Supabase Auth user.
- Revert the app deployment if the admin workspace page causes UI issues.
- Keep old Phone Number IDs and channel settings available for rollback during provider setup.

## Admin Workspace Page

Phase 1 adds:

```text
/admin/workspaces
/api/admin/workspaces
```

The API returns workspace summary counts only. It does not return WhatsApp tokens, Messenger Page Access Tokens, verify tokens, raw webhook payloads, cookies, or Supabase sessions.

The POST endpoint creates a separate workspace record and optional owner user. It does not create channel credentials, copy Welzz Stride settings, or auto-select the new workspace for the current session.

## Beta Workspace Selection

Phase 2 adds beta/admin workspace selection preparation:

```text
/api/admin/workspaces/current
/api/admin/workspaces/select
```

Admins can select a workspace from `/admin/workspaces` for testing. The selected workspace ID is stored in an HTTP-only cookie named:

```text
arbcore_selected_workspace_id
```

This cookie stores only the company/workspace ID. It does not store tokens, credentials, provider settings, cookies from Supabase, or raw session data.

Current beta resolution order:

1. Supabase Auth mapped user company remains authoritative when a mapped user exists.
2. In non-enforced beta mode, an admin-selected workspace cookie can provide the current company context.
3. If no selected workspace exists, ARBCore falls back to the default beta workspace.

Important limitations:

- Workspace selection is beta/admin-only.
- It is not safe for untrusted client access yet.
- Production SaaS switching must validate authenticated user membership and role.
- Channel credentials remain per company and are never copied.
- Webhook routing is not changed in this phase.
- Clear the selected workspace to return to the default beta fallback.

## Workspace Isolation QA

Use these Phase 3 documents before broader beta client testing:

```text
WORKSPACE_ISOLATION_QA_REPORT.md
WORKSPACE_SWITCHING_TEST_CHECKLIST.md
```

The QA pass confirms the major app modules are scoped by current company for beta/admin switching and documents the remaining limitations:

- Workspace switching remains beta/admin-only.
- Full client SaaS requires auth and company membership enforcement.
- Webhook routing still needs provider-based routing before untrusted multi-client production.
- Channel credentials remain per company and are not copied.

Provider routing foundation is documented in `PROVIDER_WEBHOOK_ROUTING_PLAN.md`. Current webhook POST handling can match WhatsApp by Phone Number ID and Messenger by Page ID, with beta fallback preserved for unmatched events.

Strict routing readiness is documented in `STRICT_PROVIDER_WEBHOOK_ROUTING.md`. Keep strict routing off until every workspace provider ID is verified.

Provider ID uniqueness readiness is documented in `PROVIDER_ID_UNIQUENESS_PLAN.md`. Use `/admin/provider-diagnostics` before enabling strict routing.

Settings now blocks duplicate non-empty WhatsApp Phone Number IDs and Messenger Page IDs across workspaces. Empty provider IDs remain allowed for workspaces that are not connected to Meta yet. Database unique constraints are still future work.
