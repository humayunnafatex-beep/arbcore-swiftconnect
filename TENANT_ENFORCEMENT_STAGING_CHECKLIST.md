# Tenant Enforcement Staging Checklist

## Purpose

Use this checklist to safely test production SaaS isolation in local or staging before paid client onboarding.

Do not run this directly against production until the full staging checklist passes and a rollback window is ready.

## Required Flags For Staging Test

Set these in local/staging only:

```env
AUTH_ENFORCED=true
PERMISSIONS_ENFORCED=true
TENANT_MEMBERSHIP_ENFORCED=true
STRICT_PROVIDER_WEBHOOK_ROUTING=true
```

Production Enterprise Beta defaults remain:

```env
AUTH_ENFORCED=false
PERMISSIONS_ENFORCED=false
TENANT_MEMBERSHIP_ENFORCED=false
STRICT_PROVIDER_WEBHOOK_ROUTING=false
```

## Pre-Test Requirements

- [ ] Supabase Auth admin user exists.
- [ ] `/auth/status` shows `supabase_mapped`.
- [ ] `/auth/permissions` shows `OWNER` or `ADMIN` for the test admin.
- [ ] `/auth/tenant-access` shows membership valid.
- [ ] `/admin/provider-diagnostics` shows no duplicate provider IDs.
- [ ] Every workspace has correct provider IDs if strict routing is tested.
- [ ] Production database is not reset.
- [ ] Database backup/export plan is understood before risky migration work.
- [ ] Vercel staging or local environment is clearly separate from production.

## Test User Matrix

Test these user states:

- [ ] `OWNER`
- [ ] `ADMIN`
- [ ] `MANAGER`
- [ ] `AGENT`
- [ ] Unmapped Supabase user
- [ ] Logged-out user

Expected result:

- `OWNER` and `ADMIN` can manage workspace-critical areas.
- `MANAGER` and `AGENT` are limited by role permissions.
- Unmapped Supabase users cannot access protected SaaS areas when auth is enforced.
- Logged-out users are redirected or blocked from protected app areas.

## Workspace Access Tests

- [ ] User can access own workspace.
- [ ] User cannot access another workspace.
- [ ] Beta cookie selection does not override mapped user in enforced mode.
- [ ] Clearing selected workspace does not break mapped user access.
- [ ] `/auth/tenant-access` remains safe and shows no tokens, raw cookies, or raw sessions.
- [ ] `/admin/workspaces` is available only to allowed admin roles when permissions are enforced.

## Module Access Tests

Open and verify expected role behavior:

- [ ] Dashboard
- [ ] Settings
- [ ] Channel Center
- [ ] Inbox
- [ ] Message Logs
- [ ] Contacts
- [ ] Auto Reply
- [ ] Campaigns
- [ ] Billing
- [ ] License
- [ ] Admin Workspaces

For each module:

- [ ] Correct workspace data appears.
- [ ] Another workspace's data does not appear.
- [ ] Unauthorized role is blocked or limited as expected.
- [ ] No access tokens or secrets are displayed.

## Webhook Strict Routing Tests

WhatsApp:

- [ ] Matched WhatsApp Phone Number ID routes to the correct workspace.
- [ ] Unmatched WhatsApp provider returns HTTP 200.
- [ ] Unmatched WhatsApp provider creates no customer `MessageLog`.
- [ ] Unmatched WhatsApp provider sends no Auto Reply.

Messenger:

- [ ] Matched Messenger Page ID routes to the correct workspace.
- [ ] Unmatched Messenger provider returns HTTP 200.
- [ ] Unmatched Messenger provider creates no customer `MessageLog`.
- [ ] Unmatched Messenger provider sends no Auto Reply.

## Rollback

Set all flags false:

```env
AUTH_ENFORCED=false
PERMISSIONS_ENFORCED=false
TENANT_MEMBERSHIP_ENFORCED=false
STRICT_PROVIDER_WEBHOOK_ROUTING=false
```

Then:

- [ ] Redeploy or restart the app.
- [ ] Do not reset the database.
- [ ] Clear selected workspace cookie from `/admin/workspaces` if needed.
- [ ] Confirm `/dashboard`, `/settings`, `/channels`, `/inbox`, and `/message-logs` load in beta mode.
- [ ] Run `npm.cmd run verify:production` if checking production read-only route health.
