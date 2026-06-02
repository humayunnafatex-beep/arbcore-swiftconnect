# Beta v1.0 Access Control Plan

## Purpose

This plan defines how internal users, selected beta clients, admins, support operators, and technical reviewers get access during ARBCore SwiftConnect Enterprise Beta v1.0.

Use this plan with:

- `BETA_V1_RELEASE_SUMMARY.md`
- `BETA_V1_STAKEHOLDER_REVIEW_CHECKLIST.md`
- `BETA_V1_DEPLOYMENT_READINESS.md`
- `BETA_V1_INTERNAL_DEPLOYMENT_RUNBOOK.md`
- `CLIENT_ONBOARDING_GUIDE.md`
- `SUPPORT_HANDOVER_NOTE.md`
- `TECHNICAL_HANDOVER_INDEX.md`

This is a documentation-only access policy. It does not enable production flags or change runtime behavior.

## Access Principles

- Access is limited to approved Beta v1.0 users.
- Users should receive only the access needed for their role.
- Client beta access must not rely on beta workspace switching as tenant security.
- WhatsApp and Messenger credentials must never be shared between workspaces.
- Tokens, secrets, cookies, and raw sessions must not be shared in screenshots, chats, or docs.
- Real provider sending must only be tested when Meta channel setup is approved.
- Paid client access requires the paid client go-live gate and staging enforcement checks.

## Approved Beta User Groups

- Internal Welzz Stride business users.
- Selected beta client owners/admins.
- ARBCore admins.
- Support operators.
- Technical reviewers.
- Business stakeholders reviewing demos or release readiness.

Unapproved users should not receive production beta access.

## Access Request Process

1. Requester submits user/client details to the access approval owner.
2. Approval owner confirms the user group and access purpose.
3. Technical owner confirms the target workspace.
4. Support owner confirms onboarding expectations if the user is external.
5. Admin creates or verifies the user/workspace record.
6. Access is documented in the final approval record.

## Access Approval Owner

Default approval owner:

```text
Name:
Role:
Contact:
```

The approval owner must confirm:

- Access purpose.
- User group.
- Workspace assignment.
- Role expectation.
- Beta limitations acknowledged.
- Offboarding owner.

## Required User / Client Information

Collect:

- Full name.
- Business name.
- Email address.
- Phone number if needed for support.
- User group.
- Requested role.
- Target workspace/company.
- Meta channel scope if provider testing is involved.
- Start date.
- Expected end date or review date.
- Approval owner.

Do not collect or store:

- Passwords.
- Access tokens.
- Card data.
- Private customer data not needed for beta setup.

## Workspace / Tenant Assignment

- Internal Welzz Stride users use the Welzz Stride/internal beta workspace.
- Selected beta clients should have a separate workspace record.
- Workspace setup is beta/admin-assisted through `/admin/workspaces`.
- The selected workspace cookie is for admin testing only.
- Production tenant security requires auth mapping, tenant membership validation, and staging enforcement tests.
- Client workspaces must use their own provider credentials and provider IDs.

## Role And Permission Assumptions

Current role assumptions:

- `OWNER`: business owner or primary admin.
- `ADMIN`: workspace admin and setup operator.
- `MANAGER`: operations or support lead.
- `AGENT`: inbox/contact support user.

Current Beta v1.0 defaults:

```env
AUTH_ENFORCED=false
PERMISSIONS_ENFORCED=false
TENANT_MEMBERSHIP_ENFORCED=false
STRICT_PROVIDER_WEBHOOK_ROUTING=false
```

Permission and tenant enforcement are readiness/reporting flows unless staging tests approve enforcement.

## Admin Access Restrictions

- Admin access is limited to trusted internal operators.
- Admin users must not copy Welzz Stride credentials into client workspaces.
- Admin users must not enable enforcement flags without staging approval.
- Admin users must not reset production database.
- Admin users must not expose access tokens or raw webhook payloads.
- `/admin/workspaces` is not a client-facing workspace switcher.

## Support Operator Access

Support operators may:

- Check Channel Center.
- Check Message Logs.
- Review Inbox state and conversation flow.
- Review Billing records if supporting payment questions.
- Use `SUPPORT_HANDOVER_NOTE.md` for issue handling.

Support operators must not:

- Ask users to share access token screenshots.
- Claim provider success without logs.
- Change provider credentials without approval.
- Enable production enforcement flags.
- Reset or mutate production database outside approved workflows.

## Technical Reviewer Access

Technical reviewers may:

- Review `TECHNICAL_HANDOVER_INDEX.md`.
- Run read-only verification commands.
- Inspect build and route status.
- Review auth, permission, tenant, provider, and deployment readiness docs.

Technical reviewers must not:

- Use production send endpoints for testing without approval.
- Run destructive Prisma commands.
- Modify production secrets without approval.
- Treat beta workspace switching as tenant enforcement.

## Client Beta Access Boundaries

Selected beta clients may:

- Use approved modules for their beta scope.
- Test Contacts, Inbox, Message Logs, Auto Reply, Campaign Drafts, Dashboard, and Billing as approved.
- Test WhatsApp/Messenger only when their provider setup is approved.

Selected beta clients must understand:

- Full production auth enforcement is not active by default.
- Permission enforcement is not active by default.
- Tenant membership enforcement is not active by default.
- Strict provider routing is not active by default.
- Bulk campaign sending is not active.
- Automated payment gateway is not active.
- Plan limits are report-only.

## Inactive / Gated Features Notice

These remain gated in Beta v1.0:

- Full production auth enforcement.
- Full production permission enforcement.
- Tenant membership enforcement.
- Strict provider routing.
- Bulk campaign sending.
- Automated payment gateway.
- Plan limit enforcement.
- Paid external client access without go-live approval.

## Data Handling Expectations

- Use only necessary beta test data.
- Do not enter secrets into docs, screenshots, or support chats.
- Do not upload unnecessary customer-sensitive data during beta.
- Keep access tokens private.
- Rotate exposed tokens immediately.
- Verify provider logs without exposing raw payloads.
- Follow support handover safety rules.

## Access Removal / Offboarding

Offboarding steps:

- [ ] Confirm user/client no longer needs access.
- [ ] Deactivate or remove the relevant user record if appropriate.
- [ ] Clear any beta workspace selection used for testing.
- [ ] Rotate provider credentials if exposure is suspected.
- [ ] Review Message Logs and support tickets for unresolved issues.
- [ ] Record offboarding date and owner.

Offboarding record:

```text
User/client:
Workspace:
Access removed by:
Date:
Notes:
```

## Incident Or Misuse Handling

If access misuse, token exposure, wrong workspace access, or provider misrouting is suspected:

1. Stop expanding access.
2. Notify technical and support owners.
3. Preserve safe logs.
4. Do not share secrets in the incident thread.
5. Rotate exposed tokens.
6. Clear selected workspace cookie if involved.
7. Keep enforcement flags false unless a controlled fix requires staging.
8. Document incident summary and resolution.

Incident record:

```text
Incident:
Detected by:
Time:
Affected workspace:
Action taken:
Follow-up:
```

## Beta Tester Onboarding Checklist

- [ ] User group is approved.
- [ ] Required user/client information is collected.
- [ ] Workspace assignment is confirmed.
- [ ] Role expectation is confirmed.
- [ ] Beta limitations are explained.
- [ ] Provider setup scope is confirmed.
- [ ] Support path is shared.
- [ ] Feedback form is shared.
- [ ] Access start date is recorded.
- [ ] Review/offboarding date is recorded.

## Final Access Approval Record

```text
User/client:
Business:
Email:
User group:
Workspace:
Role:
Approved modules:
Provider testing approved: Yes/No
Approval owner:
Technical owner:
Support owner:
Start date:
Review/offboarding date:
Decision:
Notes:
```
