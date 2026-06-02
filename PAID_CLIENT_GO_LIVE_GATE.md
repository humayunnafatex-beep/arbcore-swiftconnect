# Paid Client Go-Live Gate

## Purpose

This gate defines the minimum requirements before onboarding any paid external client to ARBCore SwiftConnect.

The app may be stable for Enterprise Beta while still not ready for paid client access. Use this document before promising a production client workspace.

## Business Requirements

- [ ] Client agreement or pilot scope is confirmed.
- [ ] Pricing or beta-commercial terms are confirmed.
- [ ] Support process and response expectations are confirmed.
- [ ] Client onboarding guide is shared.
- [ ] Beta limitations are explained clearly.
- [ ] Client understands WhatsApp/Messenger provider requirements.
- [ ] No overclaim is made about bulk sending, billing automation, or full enterprise SaaS maturity.

## Technical Requirements

- [ ] Supabase migrations are applied.
- [ ] Vercel deployment is Ready.
- [ ] Production verification script passed.
- [ ] No access token, API key, cookie, or raw session is exposed.
- [ ] Client workspace is created.
- [ ] Owner/admin user is mapped through Supabase Auth and Prisma User.
- [ ] `/auth/status` shows mapped admin status.
- [ ] `/auth/permissions` shows expected role permissions.
- [ ] `/auth/tenant-access` shows tenant membership valid.
- [ ] Provider IDs are unique across workspaces.
- [ ] Channel credentials are saved in the client workspace only.
- [ ] Channel Center diagnostics are clean.
- [ ] Message Logs load and filter correctly.
- [ ] Inbox workflow is tested for the client workspace.
- [ ] Settings save still masks access tokens after refresh.

## Security Requirements

- [ ] No shared provider credentials across clients.
- [ ] Access tokens are hidden after save and never pasted into docs/screenshots.
- [ ] WhatsApp Phone Number ID and Messenger Page ID are unique per workspace.
- [ ] Strict provider routing is tested in staging.
- [ ] Auth enforcement is tested in staging.
- [ ] Permission enforcement is tested in staging.
- [ ] Tenant membership enforcement is tested in staging.
- [ ] Rollback plan is ready.
- [ ] Support team knows how to disable enforcement flags if a staged rollout fails.

## Meta Requirements

- [ ] WhatsApp number is connected if WhatsApp is part of the client scope.
- [ ] Messenger Page is connected if Messenger is part of the client scope.
- [ ] Webhooks are verified.
- [ ] `messages` subscription is enabled.
- [ ] App review or Meta permissions are noted if required.
- [ ] Test inbound and outbound messages appear in Message Logs.
- [ ] Auto Reply behavior is tested only when provider setup is complete.

## Billing Requirements

- [ ] Plan is selected.
- [ ] Manual billing record is ready if payment has been requested or received.
- [ ] Receipt process is explained.
- [ ] Gateway automation is not active.
- [ ] Client understands pending vs confirmed manual payment status.

## Go-Live Decision

Choose one:

- [ ] Ready
- [ ] Ready with limitations
- [ ] Not ready

Decision notes:

```text

```

## Sign-Off

Technical sign-off:

```text
Name:
Date:
Notes:
```

Business sign-off:

```text
Name:
Date:
Notes:
```

Client sign-off:

```text
Name:
Date:
Notes:
```
