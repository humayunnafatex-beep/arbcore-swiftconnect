# Workspace Isolation QA Report

## Purpose

This report documents the Client Workspace Phase 3 audit for beta/admin workspace switching. The goal is to verify that major modules use the current workspace/company context safely and to identify small company scoping fixes without enabling full SaaS tenant enforcement.

This is QA hardening only. `AUTH_ENFORCED` and `PERMISSIONS_ENFORCED` remain off by default.

## Current Beta Workspace Selection Behavior

- `/admin/workspaces` can create and list workspace records.
- `/api/admin/workspaces/select` stores an admin-selected workspace ID in the HTTP-only `arbcore_selected_workspace_id` cookie.
- `/api/admin/workspaces/current` returns safe selected workspace status.
- Supabase mapped users remain authoritative.
- In non-enforced beta mode, the selected workspace cookie can provide app workspace context.
- Clearing the selected workspace returns the app to the default beta fallback.
- The cookie stores only a workspace/company ID. It does not store tokens, provider credentials, Supabase sessions, or raw cookies.

## Modules Checked

### Dashboard

- API routes: `/api/dashboard/statistics`
- Company scoping: Yes. Counts and summaries use `context.company.id`.
- Selected workspace effect: Yes, through `requirePermission()` and `getCurrentAuthContext()`.
- Risks/fixes: No code fix required.

### Settings

- API routes: `/api/settings/company`
- Company scoping: Yes. Uses `getCurrentCompany()`, which supports beta selected workspace in non-enforced mode.
- Selected workspace effect: Yes.
- Risks/fixes: Settings are company-owned and token values remain masked on GET. No code fix required.

### Channel Center

- API routes: `/api/channels/status`, `/api/channels/diagnostics`
- Company scoping: Yes. Uses current auth context company settings.
- Selected workspace effect: Yes.
- Risks/fixes: Returns token presence booleans only. No code fix required.

### Inbox

- API routes:
  - `/api/inbox/conversations`
  - `/api/inbox/conversations/[id]`
  - `/api/inbox/conversations/[id]/state`
  - `/api/inbox/conversations/[id]/contact`
  - `/api/inbox/reply`
- Company scoping: Mostly yes. Conversation reads, state upsert, assignee validation, and contact creation use current `companyId`.
- Selected workspace effect: Yes.
- Risks/fixes:
  - Fixed `/api/inbox/reply` so it no longer finds a global contact by phone and moves that contact into the selected workspace.
  - Reply logs can be created without `contactId` when the current global phone uniqueness constraint prevents creating a duplicate contact across workspaces.

### Message Logs

- API routes: `/api/whatsapp/logs`, `/api/messages/logs`
- Company scoping: Yes. Message logs and webhook summaries are filtered by current `companyId`.
- Selected workspace effect: Yes.
- Risks/fixes: No token or raw payload exposure in UI/API summaries. No code fix required.

### Contacts

- API routes: `/api/contacts`, `/api/contacts/[id]`, `/api/contacts/import`
- Company scoping: Reads, detail, update, and delete use current `companyId`.
- Selected workspace effect: Yes.
- Risks/fixes:
  - Contact create now checks duplicate phone inside the current workspace first.
  - Contact import now updates only contacts in the current workspace and skips rows that would cross into another workspace's globally unique phone record.
  - Known schema limitation: `Contact.phone` is globally unique, so the same phone cannot currently exist in two workspaces. This should become tenant-aware before production multi-client access.

### Auto Reply

- API routes: `/api/auto-reply/rules`, `/api/auto-reply/rules/[id]`
- Company scoping: Yes. Lists, creates, reads, updates, and deletes use current `companyId`.
- Selected workspace effect: Yes.
- Risks/fixes: No code fix required.

### Campaigns

- API routes:
  - `/api/campaigns`
  - `/api/campaigns/[id]`
  - `/api/campaigns/[id]/audience`
- Company scoping: Yes. Campaign list/detail/update/archive and audience preview use current `companyId`.
- Selected workspace effect: Yes.
- Risks/fixes: No code fix required.

### Billing

- API routes:
  - `/api/billing/subscription`
  - `/api/billing/payments`
  - `/api/billing/summary`
  - `/api/billing/usage`
- Company scoping: Yes. Subscription, payment records, summaries, and usage counts use current `companyId`.
- Selected workspace effect: Yes.
- Risks/fixes: No code fix required. Billing enforcement remains report-only/manual beta.

### License

- API routes: `/api/billing/subscription`, `/api/billing/summary`, `/api/billing/usage`
- Company scoping: Yes through billing APIs.
- Selected workspace effect: Yes.
- Risks/fixes: No code fix required.

### Team

- API routes: `/api/team`, `/api/team/[id]`, `/api/team/[id]/deactivate`
- Company scoping: Yes. Team list and management use current `companyId` and owner/admin role checks.
- Selected workspace effect: Yes.
- Risks/fixes: Known schema limitation: `User.email` is globally unique. This is acceptable for beta/admin mapping but should be reviewed before production multi-client SaaS.

## Webhook Routing Limitation

Webhook routing was inspected in Phase 3 and provider-routing foundation was added in Phase 4. See `PROVIDER_WEBHOOK_ROUTING_PLAN.md`.

Strict unmatched-provider behavior is documented in `STRICT_PROVIDER_WEBHOOK_ROUTING.md`.

Provider ID uniqueness diagnostics are documented in `PROVIDER_ID_UNIQUENESS_PLAN.md` and available at `/admin/provider-diagnostics`.

Current limitation:

- WhatsApp webhook POST can route by Phone Number ID when available.
- Messenger webhook POST can route by Page ID when available.
- Unmatched provider webhooks still fall back to beta/default company behavior unless `STRICT_PROVIDER_WEBHOOK_ROUTING=true`.

Future production multi-client mode must route inbound webhooks by provider identifiers:

- WhatsApp Phone Number ID and/or WhatsApp Business Account ID.
- Messenger Page ID.

Do not rely on beta selected workspace cookies for provider webhook routing. Before production multi-client use, enable and test strict provider routing or convert unmatched events into a dedicated quarantine workflow.

## Final Status

Status: Safe for beta/admin workspace switching tests after the small Inbox reply contact fix.

Not ready for untrusted multi-client production access until:

- Auth enforcement is enabled and verified.
- Permission enforcement is enabled and verified.
- User/company membership validation replaces beta cookie switching.
- Webhook routing is provider-identifier based.
- Global uniqueness constraints are reviewed for tenant-aware behavior.
