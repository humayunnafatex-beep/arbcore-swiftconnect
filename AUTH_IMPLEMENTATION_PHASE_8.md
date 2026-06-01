# Auth Implementation Phase 8

## 1. Purpose

Phase 8 applies role permission guards to selected low-risk APIs in report-only mode.

`PERMISSIONS_ENFORCED=false` remains the default, so guarded APIs continue working for the current Enterprise Beta. The guards prepare future role enforcement without changing normal successful response payloads.

## 2. APIs Guarded

Read APIs:

- `GET /api/dashboard/statistics`
- `GET /api/whatsapp/logs`

Contacts APIs:

- `GET /api/contacts`
- `POST /api/contacts`
- `GET /api/contacts/[id]`
- `PUT /api/contacts/[id]`
- `DELETE /api/contacts/[id]`

Auto Reply APIs:

- `GET /api/auto-reply/rules`
- `POST /api/auto-reply/rules`
- `GET /api/auto-reply/rules/[id]`
- `PUT /api/auto-reply/rules/[id]`
- `DELETE /api/auto-reply/rules/[id]`

Send Messages API:

- `GET /api/whatsapp/test-send`
- `POST /api/whatsapp/test-send`

`/api/auth/permissions` was intentionally not guarded in this phase. It is a diagnostic endpoint used to verify permission state, and guarding it too early could make troubleshooting harder during rollout.

## 3. Permissions Used

| API | Permission |
| --- | --- |
| `GET /api/dashboard/statistics` | `dashboard.view` |
| `GET /api/whatsapp/logs` | `messages.viewLogs` |
| `GET /api/contacts` | `contacts.view` |
| `POST /api/contacts` | `contacts.manage` |
| `GET /api/contacts/[id]` | `contacts.view` |
| `PUT /api/contacts/[id]` | `contacts.manage` |
| `DELETE /api/contacts/[id]` | `contacts.manage` |
| `GET /api/auto-reply/rules` | `autoReply.view` |
| `POST /api/auto-reply/rules` | `autoReply.manage` |
| `GET /api/auto-reply/rules/[id]` | `autoReply.view` |
| `PUT /api/auto-reply/rules/[id]` | `autoReply.manage` |
| `DELETE /api/auto-reply/rules/[id]` | `autoReply.manage` |
| `GET /api/whatsapp/test-send` | `messages.send` |
| `POST /api/whatsapp/test-send` | `messages.send` |

## 4. Why Webhook Routes Are Not Guarded

Provider webhook routes must remain public because Meta cannot use an ARBCore browser login session.

Do not guard these routes with role permissions:

- `/api/whatsapp/webhook`
- `/api/webhooks/whatsapp`
- Future `/api/messenger/webhook`

Webhook routes should be protected by provider verification tokens, app secrets, signatures, and safe payload validation instead.

## 5. Behavior With `PERMISSIONS_ENFORCED=false`

This is the default beta mode.

- `requirePermission()` loads the current auth context.
- It checks whether the role would have the requested permission.
- It returns `allowed: true` even if `wouldAllow` is false.
- API behavior remains compatible with existing frontend calls.
- No extra permission metadata is added to success payloads.

## 6. Behavior With `PERMISSIONS_ENFORCED=true`

When enabled in local or staging:

- A role with the required permission can continue.
- A role without the required permission receives safe 403 JSON.
- No tokens, cookies, raw sessions, service-role keys, or WhatsApp access tokens are exposed.

Do not enable this in production until role tests pass with limited users.

## 7. Rollback

If a guarded route blocks a valid workflow:

1. Set `PERMISSIONS_ENFORCED=false`.
2. Restart or redeploy.
3. Confirm `/auth/permissions` shows permissions enforcement off.
4. Retest Dashboard, Contacts, Auto Reply, Send Messages, and WhatsApp Logs.

## 8. Next Phase

The next phase should test real permission enforcement with limited roles in local or staging:

- Verify `OWNER` and `ADMIN` can manage settings, team, contacts, messages, and auto replies.
- Verify `MANAGER` can manage operational modules but not settings/team.
- Verify `AGENT` can use contacts/messages/logs but not manage auto replies or settings.
- Add enforcement to more APIs only after the limited-role test passes.

Phase 9 adds this local/staging test support in `AUTH_IMPLEMENTATION_PHASE_9.md` and `PERMISSION_ENFORCEMENT_TEST_CHECKLIST.md`.
