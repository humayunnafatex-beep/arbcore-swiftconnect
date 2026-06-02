# Workspace Switching Test Checklist

Use this checklist to test beta/admin workspace switching. This is not production tenant switching.

## Preparation

- [ ] Keep `AUTH_ENFORCED=false`.
- [ ] Keep `PERMISSIONS_ENFORCED=false`.
- [ ] Confirm `/admin/workspaces` loads.
- [ ] Confirm no access tokens or provider secrets are visible.

## Test Flow

1. Create a test workspace from `/admin/workspaces`.
2. Select the test workspace.
3. Confirm the current workspace status shows the selected workspace.
4. Open Dashboard and confirm it loads in the selected workspace context.
5. Open Settings and confirm company profile/settings are separate from the default workspace.
6. Add a test contact.
7. Confirm the contact appears only while the test workspace is selected.
8. Create an Auto Reply rule.
9. Confirm the rule appears only while the test workspace is selected.
10. Create a campaign draft.
11. Confirm the draft appears only while the test workspace is selected.
12. Add a manual billing record.
13. Confirm the billing record appears only while the test workspace is selected.
14. Open Inbox and Message Logs.
15. Confirm only selected workspace conversations/logs are shown.
16. Clear selected workspace from `/admin/workspaces`.
17. Open Dashboard, Contacts, Auto Reply, Campaigns, Billing, Inbox, and Message Logs again.
18. Confirm the default Welzz Stride/current beta workspace returns.
19. Confirm no WhatsApp or Messenger tokens were copied between workspaces.
20. Confirm Channel Center reflects only the selected/default workspace settings.

## Expected Results

- Selected workspace data appears while the selected workspace cookie is active.
- Default beta workspace data returns after clearing the selected workspace.
- Contacts, Auto Reply rules, campaign drafts, billing records, inbox state, and message logs stay separated by company.
- Provider tokens remain masked and are never copied between companies.

## Known Beta Limitations

- `Contact.phone` is currently globally unique, so the same phone cannot be created in two workspaces yet.
- `User.email` is currently globally unique.
- Webhook routing is not provider-ID based yet.
- Beta workspace switching uses an admin cookie and must not be used as tenant security.
