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

## 8. Phase 1 Manual Tracking Status

Phase 1 adds manual subscription and payment tracking for paid beta clients:

- `Subscription` records track plan, status, billing mode, period dates, and admin notes.
- `PaymentRecord` records track amount, currency, method, manual status, transaction reference, paid date, and notes.
- Billing UI is available at `/billing`.
- License links to Billing and shows the current manual subscription status when available.
- Admins must confirm payments manually.
- Gateway automation is not active.
- Billing/license enforcement is not active.
- Card data and sensitive payment credentials must never be stored.

## 9. Phase 2 Billing Metrics And Receipts

Phase 2 adds safe billing summary metrics and printable manual receipts:

- Billing Summary shows plan, subscription status, billing mode, confirmed totals, pending totals, last payment, period end, and days remaining.
- Confirmed totals count `CONFIRMED` payment records only.
- Pending totals count `PENDING` payment records only.
- Pending payments are not confirmed payments and must not be treated as paid access.
- Manual receipt pages are available from Payment History using View Receipt.
- Receipts show ARBCore SwiftConnect, company name, payment ID, plan, amount, method, status, reference, dates, notes, and a manual-payment disclaimer.
- Gateway automation is still not active.
- Card data and payment credentials must never be stored.

## 10. Phase 3 Report-Only Plan Limits

Phase 3 adds visible plan limits and usage indicators:

- Plan limits are defined for `ENTERPRISE_BETA`, `STARTER`, `BUSINESS`, `AGENCY`, and `ENTERPRISE`.
- Usage indicators show contacts, team members, auto-reply rules, monthly messages, inbox conversations, and enabled channels.
- Over-limit warnings are report-only and do not block beta users.
- Billing, License, and Dashboard show plan usage summaries.
- Future enforcement should wait until auth, permissions, billing, and client isolation are production-ready.
