# Tenant Membership Enforcement Plan

## Purpose

This plan prepares ARBCore SwiftConnect for production SaaS tenant access, where each authenticated user can access only the company/workspace they are allowed to use.

Phase 8 is report-only. It adds helper/API/UI visibility but does not enforce tenant membership by default.

## Current Model

- `User` belongs to exactly one `Company` through `User.companyId`.
- `Company` has many `User` records.
- `User.companyId` is enough for the first SaaS phase where one user belongs to one workspace.
- A many-to-many membership model may be needed later for agency/support users, consultants, or users who manage multiple workspaces.
- Beta workspace selection exists through the HTTP-only `arbcore_selected_workspace_id` cookie.
- `AUTH_ENFORCED=false` by default.
- `PERMISSIONS_ENFORCED=false` by default.
- `TENANT_MEMBERSHIP_ENFORCED=false` by default.

The beta selected workspace cookie is useful for admin testing, but it is not tenant security.

## Future Production Requirement

- Authenticated users must only access their own company/workspace.
- Workspace switching must validate membership and role before changing company context.
- Admin/support access must be explicit, audited, and role-based.
- Public provider webhook routes must stay public for Meta callbacks, but company routing should use provider identifiers.
- Default fallback should not be used for untrusted client access.

## Recommended Phases

### Phase 8: Helper And Report-Only Validation

- Add `lib/tenant-access.ts`.
- Add `/api/auth/tenant-access`.
- Add `/auth/tenant-access`.
- Report whether current user-company membership matches the current company context.
- Keep beta workspace switching and fallback behavior unchanged.

### Phase 9: Staging Enforcement

- Test `TENANT_MEMBERSHIP_ENFORCED=true` locally and in staging.
- Keep `AUTH_ENFORCED=true` and `PERMISSIONS_ENFORCED=true` tests separate and controlled.
- Verify mapped admin access before testing client users.
- Confirm beta selected workspace cookie is ignored or validated under enforcement.

### Phase 10: Production Enforcement

- Enable tenant membership enforcement only after real admin mapping and client workspace access are verified.
- Block workspace access when mapped user company does not match current company.
- Add explicit support/admin access if needed.
- Remove or quarantine unsafe default fallback for untrusted client routes.

## Role Behavior

- `OWNER` and `ADMIN` can manage workspace settings, team, channels, and billing in the current permission model.
- `MANAGER` and `AGENT` should have limited access based on the permission matrix.
- Future support/admin superuser access should be explicit and should not rely on the beta selected workspace cookie.

## Risks

- The selected workspace cookie could point to another company.
- An unmapped Supabase user cannot prove tenant membership.
- Default fallback can hide missing user-company mapping during beta.
- A single-company `User.companyId` model does not support multi-workspace users yet.
- Enabling tenant enforcement before auth mapping is verified can lock out admins.

## Rollback

- Keep or restore `AUTH_ENFORCED=false`.
- Keep or restore `PERMISSIONS_ENFORCED=false`.
- Keep or restore `TENANT_MEMBERSHIP_ENFORCED=false`.
- Clear the selected workspace cookie from `/admin/workspaces`.
- Use `/auth/status`, `/auth/permissions`, and `/auth/tenant-access` to verify safe beta access after rollback.

## Verification Links

```text
/auth/tenant-access
/api/auth/tenant-access
/auth/status
/auth/permissions
/admin/workspaces
```

## Phase 9 Staging And Go-Live Gate

Use these documents before moving from report-only readiness to enforcement testing or paid client onboarding:

- `TENANT_ENFORCEMENT_STAGING_CHECKLIST.md`
- `PAID_CLIENT_GO_LIVE_GATE.md`
- `ENFORCEMENT_FLAGS_REFERENCE.md`

Do not enable `TENANT_MEMBERSHIP_ENFORCED=true` in production until staging confirms mapped admin access, role permissions, tenant membership, workspace isolation, and strict provider routing behavior.
