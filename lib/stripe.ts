// Server-only Stripe wiring for the $1.50 contact-unlock checkout.
// Yemi 2026-10-02: Stripe Checkout (hosted page) integration.
//
// Yemi's side (Stripe dashboard + Render env):
//   STRIPE_SECRET_KEY      — secret API key (use a TEST key first)
//   STRIPE_WEBHOOK_SECRET  — signing secret for /api/stripe/webhook
// The price ($1.50) lives in our code (CONTACT_UNLOCK_FEE_USD) — nothing
// needs to be configured as a product/price in the Stripe dashboard.
import "server-only";

import Stripe from "stripe";
import { CONTACT_UNLOCK_FEE_USD } from "./unlock";

export function stripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

// Fee in cents for Stripe. CONTACT_UNLOCK_FEE_USD is the single source of
// truth for the price — never hardcode 150 here.
export function unlockFeeCents(): number {
  if (CONTACT_UNLOCK_FEE_USD == null) {
    throw new Error("Contact-unlock fee is not decided");
  }
  return Math.round(CONTACT_UNLOCK_FEE_USD * 100);
}
