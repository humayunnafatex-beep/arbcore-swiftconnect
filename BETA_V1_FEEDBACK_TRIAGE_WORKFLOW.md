# Beta v1.0 Feedback Triage Workflow

## Purpose

This workflow defines how feedback, bugs, access issues, provider issues, onboarding issues, billing issues, and security concerns are collected, classified, assigned, escalated, and closed during ARBCore SwiftConnect Enterprise Beta v1.0.

Use this workflow with:

- `BETA_V1_RELEASE_SUMMARY.md`
- `BETA_V1_ACCESS_CONTROL_PLAN.md`
- `BETA_V1_DEPLOYMENT_READINESS.md`
- `BETA_V1_INTERNAL_DEPLOYMENT_RUNBOOK.md`
- `SUPPORT_HANDOVER_NOTE.md`
- `CLIENT_ONBOARDING_GUIDE.md`
- `TECHNICAL_HANDOVER_INDEX.md`

This is a documentation-only support process. It does not enable production flags or change runtime behavior.

## Feedback Sources

- Welzz Stride internal beta users.
- Selected beta client users.
- Admin/support operators.
- Technical reviewers.
- Client demos.
- `BETA_FEEDBACK_FORM.md`.
- Support chats, calls, and direct messages.
- Production verification results.
- Manual QA checklists.

## Issue Intake Channels

Approved intake channels:

- Structured feedback form.
- Support owner message thread.
- Internal beta review meeting.
- Technical review note.
- Client onboarding feedback session.

Intake rules:

- Do not collect access tokens or secrets.
- Do not request screenshots that expose tokens.
- Do not paste raw webhook payloads if they may contain customer data.
- Capture page, action, time, workspace, channel, and safe error text.

## Issue Categories

- Feedback / suggestion.
- Bug.
- Access issue.
- Provider / Meta / WhatsApp issue.
- Messenger issue.
- Onboarding issue.
- Billing issue.
- Security concern.
- Documentation feedback.
- Known limitation.
- Release blocker.

## Severity Levels

### S1 Critical

- Security exposure.
- Production app unavailable.
- Wrong workspace/customer data visible.
- Real provider sends wrong message or wrong recipient.
- Payment or billing data materially wrong.

### S2 High

- Core workflow broken for beta user.
- WhatsApp/Messenger provider flow cannot be verified.
- Inbox reply/logging is unreliable.
- Access mapping blocks approved beta user.
- Deployment verification fails.

### S3 Medium

- Important workflow confusion or partial failure.
- UI copy causes repeated support questions.
- Non-critical module issue with workaround.
- Documentation gap affects onboarding.

### S4 Low

- Minor copy polish.
- Small layout issue.
- Nice-to-have improvement.
- Non-blocking documentation clarification.

## Priority Levels

- `P0`: Stop release, rollback, or block expanded beta access.
- `P1`: Fix before next beta expansion or paid demo.
- `P2`: Schedule in next beta polish pass.
- `P3`: Backlog / future improvement.

Priority is based on severity, user impact, workaround availability, and release timing.

## Triage Ownership

Default owners:

- Business owner: decides user impact and beta scope.
- Support owner: owns intake, status updates, and closure confirmation.
- Technical owner: owns reproduction, root cause, and fix recommendation.
- Security owner: owns any token, access, tenant, or data concern.
- Billing owner: owns manual payment/subscription issues.

Every issue must have one accountable owner.

## Response Expectations

- S1 / P0: acknowledge immediately when seen and escalate same day.
- S2 / P1: acknowledge within one business day.
- S3 / P2: acknowledge in the next beta review cycle.
- S4 / P3: record and batch for later review.

For external beta clients, provide clear status without overpromising fix dates.

## Escalation Path

Escalate when:

- Security, token, tenant, or wrong-workspace concern appears.
- Production verifier fails.
- Message sending behaves unexpectedly.
- Provider logs show repeated failures.
- Client cannot access approved beta workspace.
- Billing record is wrong or disputed.
- Issue may block release or paid pilot.

Escalation order:

1. Support owner records issue.
2. Technical owner reviews reproduction.
3. Security or billing owner joins if relevant.
4. Business owner decides release/client impact.
5. Rollback owner acts if needed.

## Bug Reproduction Requirements

Collect:

- User name or tester ID.
- Workspace/company.
- Page or API route.
- Action taken.
- Expected result.
- Actual result.
- Safe error text.
- Approximate date/time.
- Browser/device if UI-related.
- Channel: WhatsApp, Messenger, or app-only.
- Message Log ID or provider status if available.

Do not collect:

- Access tokens.
- Passwords.
- Raw Supabase sessions.
- Raw cookies.
- Full customer-sensitive payloads unless approved and sanitized.

## Access Issue Handling

Steps:

1. Confirm the user is approved in `BETA_V1_ACCESS_CONTROL_PLAN.md`.
2. Confirm target workspace.
3. Check `/auth/status`.
4. Check `/auth/permissions`.
5. Check `/auth/tenant-access`.
6. Confirm beta workspace switching is not treated as production tenant security.
7. Record whether the issue is beta fallback, mapping, role, or workspace assignment.

Escalate access issues if another workspace's data is visible or a mapped user cannot access approved beta workflows.

## Provider / Meta / WhatsApp Issue Handling

Steps:

1. Check Channel Center.
2. Check Message Logs.
3. Check Settings without exposing tokens.
4. Confirm WhatsApp Phone Number ID or Messenger Page ID.
5. Confirm provider status: `SENT`, `FAILED`, `RECEIVED`, or `ATTEMPTED`.
6. Confirm webhook URL and subscription status in Meta if needed.
7. Confirm no provider success is claimed unless logs support it.

Common issue types:

- Token expired.
- Wrong Phone Number ID.
- Wrong Page ID.
- Webhook verify token mismatch.
- Missing `messages` subscription.
- Test recipient not allowed.
- Message template required by Meta policy.

## Billing Issue Handling

Steps:

1. Check Billing page.
2. Confirm subscription status.
3. Confirm payment record status.
4. Confirm `PENDING` is not treated as confirmed.
5. Confirm manual receipt matches the payment record.
6. Escalate disputed or incorrect payment records to billing owner.

Billing gateway automation is inactive in Beta v1.0.

## Security Concern Handling

Treat as S1/P0 until reviewed if:

- Token, password, cookie, session, or API key is exposed.
- Wrong workspace data is visible.
- Provider message sends to wrong recipient.
- Raw customer payload is exposed.
- Unauthorized user gains access.

Immediate actions:

1. Stop expanding access.
2. Notify technical and security owners.
3. Preserve safe logs.
4. Rotate exposed tokens if needed.
5. Do not share secrets in the incident thread.
6. Document decision and closure.

## Documentation Feedback Handling

Classify documentation feedback as:

- Missing step.
- Confusing wording.
- Wrong link.
- Outdated status.
- Safety warning needed.
- Client-facing copy improvement.

Documentation fixes can be batched unless they block onboarding, deployment, security, or provider setup.

## Known Limitation Handling

If the issue is a known limitation:

1. Link to the relevant release or handover doc.
2. Confirm whether the limitation was explained during onboarding.
3. Record user impact.
4. Decide whether it remains a limitation or becomes a release blocker.

Known Beta v1.0 limitations include:

- Full auth enforcement is off by default.
- Permission enforcement is off by default.
- Tenant membership enforcement is off by default.
- Strict provider routing is off by default.
- Campaign sending is disabled.
- Billing gateway automation is inactive.
- Plan limit enforcement is report-only.

## Release Blocker Definition

An issue is a release blocker if it:

- Exposes secrets or sensitive data.
- Shows one workspace's data to another user/client.
- Breaks production deployment or critical routes.
- Causes provider sends to wrong recipient or wrong workspace.
- Prevents approved internal beta operation.
- Makes support unable to safely operate the beta.
- Invalidates the stakeholder review gate.

## Fix Decision Process

For each issue, decide:

- Fix immediately.
- Work around and document.
- Defer to next beta polish pass.
- Mark as known limitation.
- Block release or beta expansion.

Decision factors:

- Severity and priority.
- Number of affected users.
- Data/security risk.
- Provider/billing impact.
- Availability of workaround.
- Release timing.

## Rollback Decision Process

Consider rollback when:

- S1 issue appears after deployment.
- Production verifier fails after deployment.
- Critical module fails with no workaround.
- Provider sending or logs become unsafe.
- Security owner recommends rollback.

Rollback rules:

- Prefer Vercel previous deployment.
- Use Git revert if needed.
- Do not reset production database.
- Keep enforcement flags false unless a controlled staging plan says otherwise.

## Issue Closure Criteria

An issue can be closed when:

- Reproduction is understood or documented as not reproducible.
- Owner decision is recorded.
- Fix, workaround, or limitation status is documented.
- Reporter is updated if applicable.
- Support note or relevant doc is updated if needed.
- No secrets were retained in the issue record.

## Beta Feedback Review Cadence

Suggested cadence:

- Daily review during first 2-3 internal beta days.
- Twice-weekly review while selected beta client testing is active.
- Immediate review for S1/P0 issues.
- Weekly summary for business and technical owners.

Review outputs:

- New blockers.
- Fixed issues.
- Deferred issues.
- Documentation updates needed.
- Go/no-go impact.

## Final Triage Log Template

```text
Issue ID:
Date/time:
Reported by:
User group:
Workspace/company:
Category:
Severity:
Priority:
Owner:
Page/route/module:
Channel:
Summary:
Steps to reproduce:
Expected result:
Actual result:
Safe error/log reference:
Known limitation: Yes/No
Security concern: Yes/No
Billing concern: Yes/No
Provider concern: Yes/No
Decision:
Action taken:
Reporter update:
Closure criteria met:
Closed by:
Closed date:
Follow-up:
```
