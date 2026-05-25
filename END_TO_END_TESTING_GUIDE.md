# ARBCore SwiftConnect End-to-End Testing Guide

This guide covers manual testing for the local MVP, optional OpenAI mode, and optional WhatsApp Cloud API sandbox mode.

## Prerequisites

Run from the project folder:

```powershell
cd "D:\Special _ B\Auto Messaging"
npm.cmd install
npm.cmd run db:init-local
npx prisma generate
npm.cmd run dev -- -p 3000
```

Open:

```text
http://localhost:3000
```

Demo login:

```text
Email: admin@arbcore.ai
Password: demo1234
```

## 1. Local Mock Mode

Use this mode when no external API keys are configured.

1. Leave `OPENAI_API_KEY`, `WHATSAPP_ACCESS_TOKEN`, and `WHATSAPP_PHONE_NUMBER_ID` empty in `.env`.
2. Restart the dev server.
3. Login and visit `/campaigns`, `/connect`, and `/ai-studio`.
4. Send a campaign or WhatsApp test message.
5. Confirm the app shows success and creates local message logs.

Expected result:

- The app does not call OpenAI or Meta.
- AI Studio returns a mock generated message.
- WhatsApp sends are logged as mock/local sends.
- No external API errors should block the app.

## 2. OpenAI AI Studio Mode

Configure `.env`:

```env
OPENAI_API_KEY="your_openai_api_key"
OPENAI_MODEL="gpt-4o-mini"
```

Steps:

1. Restart the dev server.
2. Open `/ai-studio`.
3. Choose each tool type at least once:
   - WhatsApp campaign message generator
   - Product offer message
   - Follow-up message
   - Auto-reply suggestion
   - Bangla-English/Banglish rewrite
   - Short professional message rewrite
4. Fill business name, product/service, offer, tone, language, target audience, and original message.
5. Click `Generate Message`.
6. Confirm generated output, title, language/tone metadata, and copy/save-template buttons work.

Expected result:

- With a valid key, response provider metadata should indicate OpenAI.
- With a missing or invalid key, the app should fall back to mock output and stay usable.

## 3. WhatsApp Cloud API Sandbox Mode

Configure `.env`:

```env
WHATSAPP_ACCESS_TOKEN="your_meta_access_token"
WHATSAPP_PHONE_NUMBER_ID="your_phone_number_id"
WHATSAPP_BUSINESS_ACCOUNT_ID="your_waba_id"
WHATSAPP_VERIFY_TOKEN="choose_a_webhook_verify_token"
WHATSAPP_APP_SECRET="your_meta_app_secret"
WHATSAPP_API_VERSION="v21.0"
```

Steps:

1. Restart the dev server.
2. Open `/connect`.
3. Confirm environment status shows configured values.
4. Use a valid sandbox recipient phone number in international format without `+`.
5. Send a test message.
6. Check `/send-messages` and message logs.

Expected result:

- If Meta credentials are valid, the message is sent through the official WhatsApp Cloud API.
- If credentials are missing, the app uses mock fallback.
- If credentials are invalid, the UI shows a friendly error and logs the failed attempt.

## 4. Login / Logout

Steps:

1. Open `/login`.
2. Login with the demo account.
3. Confirm redirect to dashboard.
4. Open the top-right profile menu.
5. Click logout.
6. Try visiting `/contacts`.

Expected result:

- Logged-out users redirect to `/login`.
- Logged-in users can access dashboard modules.

## 5. Contacts Create / Import / Export

Steps:

1. Open `/contacts`.
2. Create a new contact with name, phone, email, source, tags, and status.
3. Try creating another contact with the same phone.
4. Import a CSV or Excel file through the import panel.
5. Use filters by status, tag, and source.
6. Click export CSV.

Expected result:

- New contacts appear in the table.
- Duplicate phone warning appears before duplicate create/import actions.
- Import updates/creates local records.
- Export downloads the currently filtered contact list.

## 6. Template Create / Edit / Delete

Steps:

1. Open `/campaigns`.
2. Switch to the `Templates` tab.
3. Create a template with:
   - Name
   - Category
   - Language
   - Body with variables like `{{name}}`, `{{offer}}`, `{{link}}`, `{{order_id}}`
   - Footer
   - Button text and URL placeholder
   - Status
4. Confirm WhatsApp preview updates.
5. Edit the template.
6. Try creating a duplicate template name.
7. Delete a template.

Expected result:

- Templates persist in local database.
- Duplicate template warning appears.
- Edit and delete actions update the list.

## 7. Campaign Create / Send

Steps:

1. Open `/campaigns`.
2. Click `New Campaign`.
3. Select an audience and saved template.
4. Fill variables such as offer, link, and order ID.
5. Confirm preview renders variables.
6. Save draft, schedule, or send now.

Expected result:

- Campaign appears in the campaign table.
- Send creates message logs.
- In mock mode, provider is local/mock.
- In WhatsApp sandbox mode, configured contacts are sent through Cloud API.
- Contacts marked do-not-contact/unsubscribed are skipped.

## 8. Message Logs

Steps:

1. Open `/send-messages`.
2. Send a quick message or campaign.
3. Review recent logs.
4. Use API check:

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/messages/logs" -UseBasicParsing
```

Expected result:

- Outbound and inbound logs are visible.
- Failed WhatsApp API sends store error messages.
- Status webhook events update matching logs when provider message IDs match.

## 9. Inbox / Conversations

Steps:

1. Open `/send-messages`.
2. Select a conversation from the left list.
3. Send a reply from the chat window.
4. Use quick send to an existing contact phone.

Expected result:

- Conversation list updates.
- Chat bubbles show inbound/outbound direction.
- Replies are saved through the conversation API.

## 10. Auto Reply Rules

Steps:

1. Open `/auto-reply`.
2. Create a rule from a sample category.
3. Edit keyword, response, priority, match mode, and active status.
4. Toggle active/inactive.
5. Generate an AI suggestion.
6. Delete a rule.

Expected result:

- Rules persist locally.
- Toggle updates status.
- AI suggestion uses OpenAI if configured, otherwise mock fallback.

## 11. CRM Pipeline Movement

Steps:

1. Open `/crm`.
2. Create a deal from an existing contact.
3. Move the deal through pipeline stages.
4. Mark a deal as do-not-contact.
5. Search by contact, source, owner, or note.

Expected result:

- Deal cards appear in the correct columns.
- Stage movement persists through `/api/crm/pipeline/[id]`.
- Summary cards update after refresh.

## 12. STOP / Unsubscribe Behavior

Steps:

1. Send a WhatsApp webhook payload with an incoming text body of `STOP`, `unsubscribe`, `cancel`, `optout`, or `opt-out`.
2. Confirm the contact is updated with:
   - `optedIn=false`
   - `doNotContact=true`
   - `tags=unsubscribed`
3. Try sending a campaign to that contact.

Expected result:

- Contact is marked unsubscribed.
- Campaign send skips the contact.
- Conversation and message log are still created for the inbound STOP message.

## 13. Webhook Verification

Meta will call:

```text
GET /api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=TOKEN&hub.challenge=CHALLENGE
```

Manual local check:

```powershell
Invoke-WebRequest `
  -Uri "http://localhost:3000/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=12345" `
  -UseBasicParsing
```

Expected result:

- With matching `WHATSAPP_VERIFY_TOKEN`, response body is `12345`.
- With wrong token, response is `403`.

## 14. WhatsApp Test-Send Panel

Steps:

1. Open `/connect`.
2. Check environment status.
3. Enter test recipient phone number.
4. Enter message.
5. Click `Send Test`.

Expected result:

- If WhatsApp env vars are configured, the API tries Cloud API.
- If not configured, the app logs a mock send.
- Result appears as success/error toast.

## 15. Common Errors and Fixes

| Error | Cause | Fix |
|---|---|---|
| `Could not read package.json` | Command ran from `C:\WINDOWS\System32` | Run `cd "D:\Special _ B\Auto Messaging"` first |
| Redirected to `/login` | Not authenticated | Login with `admin@arbcore.ai` / `demo1234` |
| Prisma DLL locked | Dev server is running while regenerating Prisma | Stop dev server, then run `npx prisma generate` |
| OpenAI returns fallback | Missing/invalid `OPENAI_API_KEY` or API error | Check `.env`, restart server, verify key/model |
| WhatsApp test send says not configured | Missing `WHATSAPP_ACCESS_TOKEN` or `WHATSAPP_PHONE_NUMBER_ID` | Add env vars and restart server |
| WhatsApp API phone error | Recipient phone is not in international format | Use digits only, no `+`, country code included |
| Webhook verification fails | Verify token mismatch | Match Meta token to `WHATSAPP_VERIFY_TOKEN` |
| Webhook signature invalid | App secret mismatch or altered body | Set correct `WHATSAPP_APP_SECRET`; send raw body unchanged |
| Campaign sends zero contacts | Segment has no opted-in contacts or contacts are unsubscribed | Check contact segment, `optedIn`, and `doNotContact` |
| CSV import fails | Missing required `name` or `phone` headers | Use supported headers: `name`, `phone`, `email`, `tags`, `segment`, `stage` |

## Manual QA Checklist

| Area | Test | Pass | Fail | Notes |
|---|---|---|---|---|
| Auth | Login with demo credentials |  |  |  |
| Auth | Logout redirects protected pages to `/login` |  |  |  |
| Dashboard | Dashboard loads without API errors |  |  |  |
| Contacts | Create contact |  |  |  |
| Contacts | Duplicate phone warning appears |  |  |  |
| Contacts | CSV/Excel import works |  |  |  |
| Contacts | Export CSV works |  |  |  |
| Templates | Create template |  |  |  |
| Templates | Edit template |  |  |  |
| Templates | Delete template |  |  |  |
| Templates | Duplicate template warning appears |  |  |  |
| Campaigns | Create campaign from saved template |  |  |  |
| Campaigns | Send campaign in mock mode |  |  |  |
| Campaigns | Campaign skips unsubscribed contacts |  |  |  |
| Messages | Message logs show outbound sends |  |  |  |
| Inbox | Conversation list loads |  |  |  |
| Inbox | Send reply creates chat bubble |  |  |  |
| Auto Reply | Create/edit/toggle/delete rule |  |  |  |
| Auto Reply | AI suggestion works with fallback |  |  |  |
| CRM | Create deal |  |  |  |
| CRM | Move deal across pipeline |  |  |  |
| AI Studio | Mock generation works without API key |  |  |  |
| AI Studio | OpenAI generation works with API key |  |  |  |
| WhatsApp | Connect page status loads |  |  |  |
| WhatsApp | Test-send mock fallback works |  |  |  |
| WhatsApp | Test-send Cloud API works when configured |  |  |  |
| Webhook | GET verification succeeds with correct token |  |  |  |
| Webhook | POST inbound message creates conversation |  |  |  |
| Webhook | STOP marks contact unsubscribed |  |  |  |
| Build | `npm.cmd run build` passes |  |  |  |
