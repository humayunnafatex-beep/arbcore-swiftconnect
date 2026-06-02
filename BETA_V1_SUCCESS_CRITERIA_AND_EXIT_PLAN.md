# Beta v1.0 Success Criteria And Exit Plan

## Purpose

This document defines how ARBCore SwiftConnect Enterprise Beta v1.0 will be evaluated, when it is considered successful, when it should remain in beta, and when it is blocked from expansion.

Use this plan with:

- `BETA_V1_RELEASE_SUMMARY.md`
- `BETA_V1_STAKEHOLDER_REVIEW_CHECKLIST.md`
- `BETA_V1_DEPLOYMENT_READINESS.md`
- `BETA_V1_ACCESS_CONTROL_PLAN.md`
- `BETA_V1_FEEDBACK_TRIAGE_WORKFLOW.md`
- `BETA_V1_INTERNAL_DEPLOYMENT_RUNBOOK.md`
- `PAID_CLIENT_GO_LIVE_GATE.md`
- `LAUNCH_CHECKLIST.md`
- `TECHNICAL_HANDOVER_INDEX.md`

This is a documentation-only decision guide. It does not enable production flags or change runtime behavior.

## Beta Evaluation Scope

Evaluate Beta v1.0 for:

- Welzz Stride internal business use.
- Selected beta client demos.
- Selected beta client testing.
- Paid-client pilot readiness.
- Technical readiness for v1.1 hardening.

Do not evaluate Beta v1.0 as a fully enforced production SaaS release. Auth enforcement, permission enforcement, tenant membership enforcement, strict provider routing, payment gateway automation, bulk campaign sending, and plan limit enforcement are intentionally inactive by default.

## Success Criteria

Beta v1.0 is successful when:

- Core app routes load reliably.
- Dashboard, Channel Center, Inbox, Contacts, Auto Reply, Message Logs, Campaign Drafts, Billing, Settings, and License are usable.
- WhatsApp and Messenger workflows behave safely when configured.
- Provider success is never faked.
- Access tokens remain hidden.
- Internal users can complete real operating workflows.
- Feedback is collected and triaged.
- Known limitations are understood by stakeholders.
- No release blockers remain open.

## Stability Criteria

- `npm.cmd run build` passes.
- `npm.cmd run verify:production` passes expected read-only checks.
- Vercel deployment is Ready.
- No recurring production route failures.
- No critical workflow regression in Dashboard, Inbox, Message Logs, Settings, Contacts, Auto Reply, Campaigns, Billing, or Channel Center.
- Rollback plan is available and understood.

## Security Criteria

- No access tokens, secrets, cookies, raw sessions, or private keys are exposed.
- Settings continue to hide WhatsApp and Messenger access tokens after refresh.
- Logs and diagnostics do not reveal provider tokens.
- Provider IDs remain unique across workspaces or duplicates are resolved before strict routing tests.
- Auth, permission, tenant, and strict provider enforcement remain off by default unless staging tests approve a controlled change.
- Any suspected token or workspace-data exposure is triaged as S1/P0.

## Onboarding Criteria

- `CLIENT_ONBOARDING_GUIDE.md` is usable by internal operators.
- `BETA_V1_ACCESS_CONTROL_PLAN.md` is followed for selected beta users.
- User/client role, workspace, and support expectations are recorded.
- Beta limitations are explained before demos or testing.
- Feedback form and triage workflow are shared with testers.
- Selected beta clients are not treated as paid production clients until the go-live gate passes.

## Support Criteria

- `SUPPORT_HANDOVER_NOTE.md` is reviewed.
- Support owner can use Channel Center and Message Logs for first-line checks.
- Feedback and bugs are recorded through `BETA_V1_FEEDBACK_TRIAGE_WORKFLOW.md`.
- Support does not request token screenshots.
- Support understands rollback does not include production database reset.
- Support can explain known limitations clearly.

## Provider / Meta / WhatsApp Criteria

- Channel Center displays setup status without tokens.
- WhatsApp works only when Meta Cloud API settings are configured.
- Messenger works only when Page API settings are configured.
- Inbound/outbound provider status is verified through Message Logs.
- Welzz Stride number `01958474577` is not claimed active unless Meta verification and logs prove it.
- Webhook setup, verify token, and `messages` subscription are checked before live provider claims.
- Provider errors are classified and triaged without exposing secrets.

## Billing Criteria

- Billing page loads.
- Manual subscription status is understood.
- Manual payment records are tracked correctly.
- Receipts do not expose card data or secrets.
- `PENDING` payment records are not treated as confirmed.
- Gateway automation remains inactive.
- Plan usage is report-only and does not block usage.

## Workspace / Tenant Criteria

- Workspace creation is understood as beta/admin-assisted.
- Selected workspace cookie is not treated as production tenant security.
- `/auth/tenant-access` is used as a readiness check.
- Paid client access requires tenant enforcement staging tests.
- Provider IDs are unique per workspace.
- Client provider credentials are not copied from Welzz Stride.
- Wrong-workspace data visibility is a release blocker.

## Documentation Criteria

- `BETA_V1_RELEASE_SUMMARY.md` is current.
- `BETA_V1_STAKEHOLDER_REVIEW_CHECKLIST.md` is complete or decision notes are recorded.
- `BETA_V1_DEPLOYMENT_READINESS.md` is complete before deployment or access expansion.
- `BETA_V1_INTERNAL_DEPLOYMENT_RUNBOOK.md` is available to operators.
- `TECHNICAL_HANDOVER_INDEX.md` points to current docs.
- Known limitations are documented and easy to find.

## Feedback And Issue Criteria

- Feedback sources are active.
- Issues are classified by category, severity, and priority.
- S1/P0 issues are escalated immediately.
- Release blockers are not left unresolved.
- Known limitations are separated from bugs.
- Closure criteria are recorded before issues are closed.
- Weekly or daily review cadence is followed based on beta stage.

## Known Limitation Acceptance

Known limitations are acceptable when:

- They are documented.
- They are communicated before onboarding or demo.
- They do not expose data or secrets.
- They do not cause wrong provider sends.
- They do not block internal beta workflows.
- They are assigned to v1.1, paid pilot readiness, or future production hardening where appropriate.

Known limitations are not acceptable when they create a release blocker or invalidate stakeholder sign-off.

## Blocker Conditions

Block expansion if any of these are true:

- Secrets, tokens, sessions, or private customer data are exposed.
- Wrong workspace data is visible.
- Provider sends are unsafe or misrouted.
- Production verifier fails with no explanation or workaround.
- Core internal beta workflows are unusable.
- Support cannot safely triage issues.
- Paid client access is requested without go-live gate approval.
- Auth/permission/tenant/strict provider enforcement is enabled without staging approval.

## Expansion Readiness

Ready to expand to selected client beta when:

- Internal beta workflows are stable.
- No S1/P0 issues are open.
- Feedback triage is active.
- Access control plan is followed.
- Selected beta workspace and role expectations are recorded.
- Provider setup is clearly scoped.
- Support owner approves expanded access.

## Paid Client Readiness

Ready to prepare a paid-client pilot when:

- `PAID_CLIENT_GO_LIVE_GATE.md` is complete.
- `TENANT_ENFORCEMENT_STAGING_CHECKLIST.md` is complete.
- Auth, permission, tenant, and provider routing staging tests pass.
- Client workspace is created and reviewed.
- Owner/admin user mapping is verified.
- Billing plan and manual record process are confirmed.
- Support handover is ready.

## Exit Options

Choose one outcome:

- Continue internal beta.
- Expand to selected client beta.
- Prepare paid-client pilot.
- Prepare v1.1 hardening release.
- Block expansion pending fixes.

## Final Beta Outcome Decision

```text
Outcome:
Decision owner:
Business owner:
Technical owner:
Support owner:
Date:
Reason:
Open blockers:
Accepted limitations:
Next review date:
```

## Follow-Up Plan For v1.1 Or Production Expansion

Potential v1.1/hardening focus:

- Auth enforcement staging and production rollout.
- Permission enforcement staging and production rollout.
- Tenant membership enforcement.
- Strict provider routing after clean provider diagnostics.
- Paid client onboarding flow hardening.
- Messenger production app review and permissions.
- Campaign sending compliance, queueing, templates, and rate limits.
- Billing gateway automation.
- Plan limit enforcement.
- Monitoring and alerting improvements.

Follow-up plan:

```text
Priority:
Owner:
Target phase:
Dependencies:
Notes:
```
