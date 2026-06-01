# ARBCore SwiftConnect SaaS Architecture Plan

## 1. Product Goal

ARBCore SwiftConnect should first serve Welzz Stride as an internal WhatsApp business operating system. After the Welzz Stride workflow is stable, the same platform should become a paid web-based SaaS service for other businesses.

Primary direction:

- Own business use first: Welzz Stride.
- Future paid client service for multiple businesses.
- Web/browser-based system, not an `.exe`.
- Production-ready hosting, cloud database, security, and provider integrations.
- Incremental delivery without breaking current WhatsApp beta features.

## 2. Core Modules

- Dashboard: business activity summary, counts, and operational health.
- Contacts: customer records, tags, stages, opt-in state, and search.
- Inbox / Message Logs: inbound/outbound activity, provider IDs, provider errors, and webhook summaries.
- WhatsApp: Meta WhatsApp Cloud API outbound send, inbound webhook receive, logs, and live auto reply.
- Messenger: future Meta Messenger channel for Facebook Page messages.
- Auto Reply: keyword rules for live channel responses.
- Campaigns: planned outreach, templates, scheduling, and send tracking.
- CRM: lead/deal pipeline and follow-up actions.
- Settings: company profile, channel credentials, webhook URLs, notifications, and team configuration.
- Team: users, roles, active/inactive status, and future access control.
- License: beta plan display and future entitlement visibility.
- Payment / Subscription: future manual and gateway-backed subscription management.

## 3. Current Prisma SaaS Readiness

The current schema already includes these useful SaaS foundations:

- `Company`: workspace/business owner record with plan, profile, language, notifications, WhatsApp and Messenger foundation settings, and relations.
- `User`: team member record with role and active status.
- `Contact`: customer profile with company relation, phone, email, tags, stage, opt-in, and do-not-contact.
- `MessageLog`: inbound/outbound log with channel, status, provider message ID, errors, and company/contact/campaign relations.
- `WebhookEvent`: raw provider webhook event storage with provider, event type, payload, and company relation.
- `AutoReplyRule`: company-owned keyword, response, priority, active state, and match mode.
- `Campaign`, `Conversation`, `CrmDeal`, `MessageTemplate`, `AIUsage`: helpful base models for the broader workspace.
- License/plan support exists only as `Company.plan`; full subscription entities are not implemented yet.

Recommended future schema changes, not implemented in this pass:

- Add channel-aware settings models instead of storing all provider settings directly on `Company`.
- Add `Subscription`, `Invoice`, `Payment`, `Plan`, and `FeatureLimit`.
- Add audit logs for sensitive admin actions and billing events.
- Harden company scoping and uniqueness rules before large multi-client rollout.

For the detailed auth, role, and workspace isolation plan, use `AUTH_WORKSPACE_HARDENING_PLAN.md`.

For the first non-breaking auth foundation step, use `AUTH_IMPLEMENTATION_PHASE_1.md`.

Phase 2 adds Supabase Auth browser/server helpers and a login/logout surface while keeping auth enforcement disabled until route protection is rolled out safely.

Phase 3 route protection readiness is documented in `AUTH_IMPLEMENTATION_PHASE_3.md`; enforcement remains off unless `AUTH_ENFORCED=true`.

Phase 4 Supabase Auth to Prisma user/company mapping is documented in `AUTH_IMPLEMENTATION_PHASE_4.md` and `SUPABASE_ADMIN_USER_MAPPING.md`.

Phase 5 and Phase 6 add safe admin mapping verification and local/staging enforcement readiness. Use `AUTH_IMPLEMENTATION_PHASE_5.md`, `AUTH_IMPLEMENTATION_PHASE_6.md`, and `AUTH_ENFORCEMENT_TEST_CHECKLIST.md` before enabling `AUTH_ENFORCED=true`.

Phase 7 adds role permission readiness. Use `AUTH_IMPLEMENTATION_PHASE_7.md`, `/auth/permissions`, and `/api/auth/permissions` before enabling `PERMISSIONS_ENFORCED=true`.

Phase 8 and Phase 9 apply selected API guards and local/staging permission enforcement test support. Use `AUTH_IMPLEMENTATION_PHASE_8.md`, `AUTH_IMPLEMENTATION_PHASE_9.md`, and `PERMISSION_ENFORCEMENT_TEST_CHECKLIST.md` before any production role blocking.

## 4. Multi-Client Model

Future SaaS structure should be workspace-first:

- Company / Workspace: the tenant boundary for every client business.
- Users: people who can log into a workspace.
- Roles: owner, admin, manager, agent, and future billing/admin permissions.
- Channels: WhatsApp, Messenger, and future communication providers.
- Contacts: company-owned customer records.
- Message logs: company-owned communication records, ideally channel-aware.
- Auto reply rules: company-owned automation rules, ideally channel-aware.
- Subscription / Plan: controls paid access, feature limits, and billing state.

Important SaaS rule: every operational API must scope database reads and writes by `companyId`.

## 5. Channel Architecture

Current status:

- WhatsApp Cloud API is active.
- WhatsApp outbound send works.
- WhatsApp inbound webhook receive works.
- WhatsApp Logs viewer works.
- Live WhatsApp Auto Reply works.
- Messenger foundation settings, `/api/messenger/webhook`, `/api/messenger/test-send`, and `MESSENGER` inbound logging are prepared.

Future channel direction:

- Messenger Send API and auto-reply should be completed as separate future phases.
- Auto Reply should become channel-agnostic: `WHATSAPP`, `MESSENGER`, and future channels.
- `MessageLog` should support an explicit `channel` field.
- Webhook routes should be separated by channel:

```text
/api/whatsapp/webhook
/api/messenger/webhook
```

Recommended rule engine direction:

1. Parse inbound provider event.
2. Normalize message into a common internal shape.
3. Log inbound message with channel, provider ID, company, contact, and status.
4. Match active auto-reply rules by company and channel.
5. Send through the provider-specific send helper.
6. Log outbound `SENT` only after provider success.
7. Log outbound `FAILED` if the provider rejects the request.

## 6. Security Architecture

Required production direction:

- Login/Auth system: replace demo-cookie auth before commercial launch.
- Auth enforcement: test `AUTH_ENFORCED=true` locally or in staging with `AUTH_ENFORCEMENT_TEST_CHECKLIST.md` before production.
- Permission enforcement: test `PERMISSIONS_ENFORCED=true` only after role permissions are verified in `/auth/permissions`.
- Role-based access control: protect Settings, Billing, Team, and provider credentials.
- Environment variables: keep database URLs, app secrets, and provider secrets out of Git.
- Token masking: never return or display access tokens after save.
- No secret logging: provider errors should be safe and token-free.
- Webhook verification: verify WhatsApp and future Messenger webhook tokens/signatures.
- Input validation: validate all API request payloads.
- API error hardening: friendly client messages, safe server logging.
- Audit logs if future needed: track sensitive settings, billing, and team changes.

## 7. Cloud, Database, And Hosting

Recommended stack:

- Hosting: Vercel.
- Database: Supabase PostgreSQL.
- File storage: Supabase Storage.
- Auth: Supabase Auth or NextAuth.
- Payment: SSLCommerz, bKash, Nagad, or Stripe depending on target market and availability.
- Monitoring: Vercel Logs plus Sentry.

Operational expectations:

- Run Prisma migrations intentionally.
- Keep production and migration database URLs separate.
- Use Vercel environment variables for secrets.
- Keep local `.env` private.
- Add Sentry before broad paid rollout.

## 8. Payment And Subscription Plan

Future approach:

- Enterprise Beta: current internal/beta mode.
- Starter: small business workspace, limited contacts, team, and message history.
- Business: higher limits, WhatsApp automation, Messenger when available, campaigns.
- Enterprise: custom limits, multiple numbers/pages, priority support.
- Monthly subscription billing.
- Feature limits by plan.
- Manual payment first, gateway later.
- Do not block existing beta features yet.

Billing enforcement should start as admin/manual activation. Gateway-backed activation should only mark payment successful after confirmed provider webhook or verified transaction status.

## 9. Messenger Future Integration Plan

Messenger should be added after WhatsApp beta stabilization and auth/workspace hardening.

High-level steps:

1. Connect a Meta Facebook Page.
2. Add Messenger product to the Meta App.
3. Store Page ID, Page Access Token, Verify Token, and Webhook URL safely.
4. Configure `/api/messenger/webhook`.
5. Subscribe to Messenger `messages` webhook event.
6. Log inbound Messenger messages.
7. Match channel-aware Auto Reply rules in a future phase.
8. Send replies through Messenger Send API in a future phase.
9. Log `SENT` only after provider success.
10. Keep Page Access Token private and masked.

## 10. Development Phases

### Phase 1: Current WhatsApp Beta Stabilization

- Keep WhatsApp send, webhook, logs, and live auto reply stable.
- Connect Welzz Stride real number only after Meta verification.
- Improve docs and operational checklists.

### Phase 2: Auth + Roles

- Replace demo auth.
- Add production login.
- Enforce role-based permissions.
- Protect provider settings and team management.

### Phase 3: Multi-Client Workspace Hardening

- Audit every API for `companyId` scoping.
- Strengthen uniqueness rules for multi-tenant use.
- Add workspace switching only if needed.
- Prepare channel-aware database fields.

### Phase 4: Messenger Channel Integration

- Add Messenger settings, webhook, logs, send helper, and safe auto replies.
- Do not fake Messenger support before Meta setup works.

### Phase 5: Payment / Subscription

- Start with manual payment plus admin activation.
- Add subscription entities.
- Add gateway webhook verification later.
- Enforce limits gradually.

### Phase 6: Campaigns And Advanced Analytics

- Add approved template campaign sending.
- Add channel analytics.
- Add delivery/read tracking views.
- Add plan-based usage dashboards.
