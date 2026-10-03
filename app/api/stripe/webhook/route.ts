import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { raw } from "@/lib/inbox";
import { getStripe } from "@/lib/stripe";

// POST /api/stripe/webhook — Stripe sends checkout.session.completed here
// after a successful $1.50 contact-unlock payment (Yemi 2026-10-02).
// Verifies the Stripe signature, then unlocks the pair. Fully idempotent:
// signature-checked, and replays/double-deliveries change nothing.
export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });
  }

  // Read the RAW body — signature verification fails on parsed JSON.
  const rawBody = await req.text();
  let event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      metadata?: { conversationId?: string; paidById?: string };
      amount_total?: number | null;
    };
    const conversationId = session.metadata?.conversationId;
    const paidById = session.metadata?.paidById;
    const amountCents = session.amount_total ?? 150;
    if (conversationId && paidById) {
      const db = getDb();
      if (db) {
        // Unlock the pair.
        await raw(
          db,
          `UPDATE "Conversation" SET "unlockedContact" = TRUE WHERE "id" = $1`,
          conversationId
        );
        // Record the receipt. ON CONFLICT DO NOTHING keeps webhook
        // replays and double-deliveries from erroring.
        await raw(
          db,
          `INSERT INTO "ContactUnlock" ("id", "conversationId", "paidById", "amountCents", "createdAt")
           VALUES (gen_random_uuid(), $1, $2, $3, NOW())
           ON CONFLICT ("conversationId") DO NOTHING`,
          conversationId,
          paidById,
          amountCents
        );
      }
    }
  }

  return NextResponse.json({ received: true });
}
