// Contact-unlock configuration (Big/MVP).
//
// Yemi's decided unlock model (2026-09-30):
//   - A ONE-TIME fee unlocks direct-contact sharing for ONE client/AI pro pair.
//   - EITHER side can pay — payment by either the client or the AI pro
//     unlocks the pair.
//
// ================================================================
// YEMI — SET THE PRICE HERE. Payments cannot go live until this is
// a number AND Stripe is connected.
// Yemi's decision 2026-10-01: $1 USD one-time fee.
// Yemi's decision 2026-10-02: raised to $1.50 USD one-time fee.
// ================================================================
export const CONTACT_UNLOCK_FEE_USD: number | null = 1.5;

// Payments are NOT wired up yet. Flip to true only after:
//   1. CONTACT_UNLOCK_FEE_USD above is set to the decided price, and
//   2. Stripe is connected and the checkout flow is built.
export const STRIPE_CONNECTED = false;

// True when a user can actually pay: price decided + Stripe connected.
export function paymentsEnabled(): boolean {
  return STRIPE_CONNECTED && CONTACT_UNLOCK_FEE_USD != null;
}

// Human-readable fee for the UI. Never invents a price: while the fee is
// undecided it says so plainly.
export function unlockFeeLabel(): string {
  return CONTACT_UNLOCK_FEE_USD == null
    ? "Price to be announced"
    : `$${CONTACT_UNLOCK_FEE_USD} USD`;
}
