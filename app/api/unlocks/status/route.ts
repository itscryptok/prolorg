import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { raw } from "@/lib/inbox";
import { stripeConfigured } from "@/lib/stripe";
import { CONTACT_UNLOCK_FEE_USD, unlockFeeLabel } from "@/lib/unlock";

type ConvRow = { id: string; unlockedContact: boolean };

// GET /api/unlocks/status?conversationId=... — participant only.
// Tells the client whether the pair is already unlocked and whether the
// $1.50 payment flow is live. Client components must use this instead of
// reading server env vars (Yemi 2026-10-02).
export async function GET(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database unavailable." }, { status: 503 });

  const conversationId = new URL(req.url).searchParams.get("conversationId");
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

  return NextResponse.json({
    unlocked: conv.unlockedContact,
    canPay: stripeConfigured() && CONTACT_UNLOCK_FEE_USD != null,
    feeLabel: unlockFeeLabel(),
  });
}
