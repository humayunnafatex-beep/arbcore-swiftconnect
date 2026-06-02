# Security QA Report

## Token Handling Summary

The beta app stores WhatsApp and Messenger provider tokens server-side in company settings. UI/API responses reviewed during this pass return token presence booleans or blank token fields, not the token values.

## WhatsApp Token Safety

- Settings GET returns `whatsappAccessToken: ""` and `whatsappAccessTokenSaved`.
- Channel Center returns `accessTokenPresent`, not the token.
- Diagnostics returns missing field names only.
- Send, webhook, auto-reply, and Inbox reply routes use the token server-side and do not return it.

## Messenger Token Safety

- Settings GET returns `messengerPageAccessToken: ""` and `messengerPageAccessTokenSaved`.
- Channel Center returns `pageAccessTokenPresent`, not the token.
- Messenger test send, webhook auto-reply, and Inbox reply use the Page Access Token server-side only.

## Supabase Environment Safety

- `.env.example` contains placeholders only.
- `DATABASE_URL`, `DIRECT_URL`, `SESSION_SECRET`, and Supabase keys are documented as environment values, not real credentials.
- No service-role key is required or exposed in the reviewed auth readiness routes.

## Webhook Public-But-Verified Status

- WhatsApp and Messenger webhook routes remain public for Meta callbacks.
- Verification token checks exist for GET verification.
- WhatsApp app-secret signature validation is supported when configured.
- Webhook responses should not expose raw secrets.

## Auth Enforcement Status

- `AUTH_ENFORCED` remains off by default.
- Auth status routes return safe metadata only: user existence, email, role, mapping, company summary, and mode.
- Raw sessions, cookies, and Supabase tokens are not returned.

## Permission Enforcement Status

- `PERMISSIONS_ENFORCED` remains off by default.
- Guarded APIs continue beta behavior while still reporting readiness.
- Public webhook routes are not globally blocked.

## Known Beta Limitations

- Multi-client production onboarding still requires final auth/company isolation validation.
- Billing and license enforcement are not active.
- Messenger production use may require Meta app review and permissions.
- Token rotation is manual if a credential is exposed.
- Webhook payload retention should be reviewed before high-volume client onboarding.
