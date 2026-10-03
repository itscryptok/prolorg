import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { raw } from "@/lib/inbox";
import { getStripe, stripeConfigured, unlockFeeCents } from "@/lib/stripe";
import { CONTACT_UNLOCK_FEE_USD } from "@/lib/unlock";

type ConvRow = { id: string; unlockedContact: boolean };

// POST /api/unlocks/checkout — creates a Stripe Checkout session for the
// one-time contact-unlock fee of one client/AI pro pair (Yemi 2026-10-02).
// Either side may pay. Returns the hosted Stripe URL to redirect to.
export async function POST(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!stripeConfigured() || CONTACT_UNLOCK_FEE_USD == null) {
    return NextResponse.json({ error: "Payments are not enabled yet." }, { status: 503 });
  }
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database unavailable." }, { status: 503 });

  let body: { conversationId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const conversationId = body.conversationId;
  if (!conversationId) {
    return NextResponse.json({ error: "Missing conversationId." }, { status: 400 });
  }

  const rows = await raw<ConvRow>(
    db,
    `SELECT "id", "unlockedContact" FROM "Conversation"
     WHERE "id" = $1 AND ("clientId" = $2 OR "expertId" = $2)
     LIMIT 1`,
    conversationId,
    user.id
  );
  const conv = rows[0];
  if (!conv) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  if (conv.unlockedContact) {
    return NextResponse.json({ error: "This pair is already unlocked." }, { status: 409 });
  }

  // Build the public origin for Stripe's success/cancel redirects. The
  // app runs behind Render's proxy, so req.url alone can resolve to the
  // internal address (localhost:10000) — prefer the forwarded host/proto.
  const fwdHost = req.headers.get("x-forwarded-host");
  const fwdProto = req.headers.get("x-forwarded-proto");
  const origin =
    fwdHost != null
      ? `${fwdProto ?? "https"}://${fwdHost}`
      : new URL(req.url).origin;
  let url: string | null;
  try {
    const session = await getStripe().checkout.sessions.create({
      // Stripe API version 2026-09-30.endive renamed this value:
      // "hosted" is rejected ("no longer supported"), "hosted_page" is
      // the hosted checkout page mode.
      ui_mode: "hosted_page",
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: unlockFeeCents(), // from CONTACT_UNLOCK_FEE_USD ($1.50)
            product_data: {
              name: "Prolice AI trade unlock - Either client or expert can pay to unlock limitless conversation so as to be able to exchange external communication details and payment details",
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/unlock/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/inbox/${conversationId}`,
      // Kept intentionally: this is the application link the webhook uses
      // to unlock the correct pair after payment — removing it would break
      // fulfillment (user pays, pair never unlocks).
      metadata: { conversationId, paidById: user.id },
    });
    url = session.url;
  } catch (err) {
    console.error("[unlocks] checkout session create failed:", err);
    return NextResponse.json({ error: "Could not start checkout." }, { status: 502 });
  }
  if (!url) return NextResponse.json({ error: "Could not start checkout." }, { status: 502 });
  return NextResponse.json({ url });
}
