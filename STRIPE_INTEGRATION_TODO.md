# STRIPE_INTEGRATION_TODO.md

Single source of truth for the Prolice AI Stripe Checkout integration
(Scenario A — an existing `stripe.checkout.sessions.create(...)` call was
found and updated with Yemi's Checkout Studio values on 2026-10-02).

## Values to Replace

No placeholders remain. Every `sample_only` parameter already carries a real
value in [app/api/unlocks/checkout/route.ts](app/api/unlocks/checkout/route.ts)
and was preserved per Scenario A precedence rules.

| Field | Current Value | What to Set |
|-------|--------------|-------------|
| mode | `payment` | Correct — one-time $1.50 unlock, not a subscription. |
| success_url | `{origin}/unlock/success?session_id={CHECKOUT_SESSION_ID}` | Live — keep the `{CHECKOUT_SESSION_ID}` template. |
| cancel_url | `{origin}/inbox/{conversationId}` | Live — returns the user to their chat. |
| line_items | inline `price_data` — $1.50 USD, product name set in code | Live — no dashboard Price ID needed; the $1.50 fee comes from `CONTACT_UNLOCK_FEE_USD` in [lib/unlock.ts](lib/unlock.ts). |

Checkout item line (as Yemi wrote it 2026-10-02 — note the spelling
"Prolice"; change to "Prolice AI" in the `product_data.name` in
[app/api/unlocks/checkout/route.ts](app/api/unlocks/checkout/route.ts)
if that was a typo):

> Prolice AI trade unlock - Either client or expert can pay to unlock limitless conversation so as to be able to exchange external communication details and payment details

## Configured Parameters

Fixed by Yemi in the Checkout Studio UI; applied exactly in
[app/api/unlocks/checkout/route.ts](app/api/unlocks/checkout/route.ts).

| Parameter | Value |
|-----------|-------|
| ui_mode | `hosted_page` (stripe SDK ^23.0.0 ≥ 21.0.0 — see ui_mode versioning rule) |
| billing_address_collection | `auto` |
| phone_number_collection | `{ enabled: false }` |
| automatic_tax | `{ enabled: false }` |
| allow_promotion_codes | `false` |
| submit_type | `auto` |
| integration_identifier | `hosted_web_0001` |
| origin_context | `web` |
| payment_method_collection | **omitted intentionally** — fixed_by_ui value is `"always"`, but per rule 8 it is only included when `mode` is `"subscription"`. Ours is `"payment"`. |

**Intentionally kept** (not a Checkout Studio parameter — required for
fulfillment): `metadata: { conversationId, paidById }`. The webhook at
[app/api/stripe/webhook/route.ts](app/api/stripe/webhook/route.ts) reads this
to unlock the correct client/AI pro pair after payment. Removing it would
break fulfillment (user pays, pair never unlocks).

## Setup and next steps

### Environment variables (Render dashboard → aiprolice service → Environment)

| Variable | Value | Where to get it |
|----------|-------|-----------------|
| `STRIPE_SECRET_KEY` | `sk_test_...` first, `sk_live_...` when going live | Stripe Dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Stripe Dashboard → Developers → Webhooks → Add endpoint |

Variable names match the code exactly (`lib/stripe.ts`,
`app/api/stripe/webhook/route.ts`). No publishable key is needed —
checkout is fully hosted, no client-side Stripe.js.

### Webhook endpoint

URL: `https://aiprolice.onrender.com/api/stripe/webhook`
Event: `checkout.session.completed`

Add it **after** the new code is deployed (the route must exist before
Stripe can deliver to it). The handler verifies the Stripe signature and is
idempotent — replays and double-deliveries change nothing.

### Project structure (new files, 2026-10-02)

- `lib/stripe.ts` — server-only Stripe client + `stripeConfigured()` / `unlockFeeCents()`
- `app/api/unlocks/checkout/route.ts` — creates the Checkout Session (the call updated above)
- `app/api/unlocks/status/route.ts` — tells the client whether payment is live (client components can't read server env)
- `app/api/stripe/webhook/route.ts` — fulfills payment: unlocks the pair, records the receipt
- `app/unlock/success/page.tsx` — post-payment confirmation page
- `components/ContactUnlockPopover.tsx` — pay button now redirects to Stripe Checkout

### How it works

1. User clicks "Pay $1.50 USD to unlock this pair" in the inbox popover.
2. `POST /api/unlocks/checkout` creates a hosted Checkout Session ($1.50, one pair) → user is redirected to Stripe.
3. On success, Stripe fires `checkout.session.completed` → webhook sets `Conversation.unlockedContact = true` and writes the `ContactUnlock` receipt.
4. User lands on `/unlock/success`, which verifies the session with Stripe and links back to the chat.

### Testing

- Use **test mode** keys first (`sk_test_...`).
- Test card: `4242 4242 4242 4242`, any future expiry, any CVC.
- Complete a $1.50 checkout as one side of a test conversation, then confirm the pair shows "Direct contact unlocked for this pair".
- In the Stripe Dashboard → Webhooks, use "Send test webhook" for `checkout.session.completed` to verify the endpoint signature check.

### Next steps

1. Add both env vars in Render (test keys first).
2. Deploy, then add the webhook endpoint in Stripe and copy its signing secret to Render.
3. Run the test-card flow end to end.
4. Swap `STRIPE_SECRET_KEY` to the live key when ready to charge real users.

### Resources

- https://support.stripe.com
- https://docs.stripe.com/mcp
