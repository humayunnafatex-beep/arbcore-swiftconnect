# Payment And Subscription Plan

## 1. Purpose

This plan documents how ARBCore SwiftConnect can move from Enterprise Beta to a paid SaaS service without faking billing status or disrupting current beta features.

## 2. Recommended Bangladesh-Friendly Payment Options

Start simple:

- Manual bank/mobile payment first.
- SSLCommerz for card/mobile wallet aggregation.
- bKash or Nagad gateway if available and suitable.
- Stripe for international clients if available.

Manual payment plus admin activation is the safest first step for a controlled beta-to-paid transition.

## 3. Suggested Plans

- Enterprise Beta: current internal/beta access with no automated billing enforcement.
- Starter: small business usage, limited contacts, team members, logs, and automation.
- Business: higher limits, WhatsApp automation, campaigns, and future Messenger access.
- Agency/Enterprise: custom usage limits, multiple channels, priority support, and custom onboarding.

## 4. Possible Limits

Future plan limits can include:

- Number of contacts.
- Number of team members.
- Number of messages/logs retained.
- Number of auto-reply rules.
- Channel access: WhatsApp, Messenger, or both.
- Campaign sends.
- AI generation usage.
- Storage usage.

## 5. Database Entities Needed In Future

Recommended future entities:

- `Subscription`
- `Invoice`
- `Payment`
- `Plan`
- `FeatureLimit`

Potential supporting fields:

- Subscription status.
- Current period start/end.
- Gateway name.
- Gateway transaction ID.
- Manual approval user.
- Payment confirmation timestamp.
- Failed/cancelled reason.

## 6. Safety

- Do not mark payment successful unless the gateway confirms it or an admin manually verifies it.
- Keep payment webhooks secure.
- Store transaction IDs.
- Avoid storing card data.
- Do not log sensitive payment credentials.
- Use idempotency or transaction IDs to avoid duplicate activation.
- Keep beta features available until billing enforcement is intentionally enabled.

## 7. First Implementation Recommendation

First paid rollout should use:

1. Manual payment collection.
2. Admin review.
3. Manual workspace activation or plan update.
4. Basic invoice/receipt record.
5. Later gateway integration after operational flow is stable.

Gateway automation can follow once the manual process is proven and the subscription database model is ready.
