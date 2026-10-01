import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { inbox, raw } from "@/lib/inbox";

type ConvoRow = { id: string; clientId: string; expertId: string };

// POST /api/hires — client creates a hire request in a conversation.
// Body: { conversationId, scope, price, agreement? }
export async function POST(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database unavailable." }, { status: 503 });

  let body: { conversationId?: string; scope?: string; price?: number; agreement?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const scope = (body.scope ?? "").trim();
  const agreement = (body.agreement ?? "").trim() || null;
  const price = body.price;

  if (!body.conversationId) return NextResponse.json({ error: "Conversation is required." }, { status: 400 });
  if (scope.length < 10) {
    return NextResponse.json({ error: "Describe the work in a bit more detail (10+ characters)." }, { status: 400 });
  }
  if (!Number.isInteger(price) || (price as number) < 1 || (price as number) > 1_000_000) {
    return NextResponse.json({ error: "Enter a valid price in USD." }, { status: 400 });
  }
  if (agreement && agreement.length > 5000) {
    return NextResponse.json({ error: "Agreement text is too long (5,000 characters max)." }, { status: 400 });
  }

  const convos = await raw<ConvoRow>(
    db,
    `SELECT "id", "clientId", "expertId" FROM "Conversation" WHERE "id" = $1 LIMIT 1`,
    body.conversationId
  );
  const convo = convos[0];
  if (!convo) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  if (convo.clientId !== user.id) {
    return NextResponse.json({ error: "Only the client can create a hire request." }, { status: 403 });
  }

  const hire = await inbox(db).hireRequest.create({
    data: {
      conversationId: convo.id,
      scope,
      price: price as number,
      agreement,
      status: "REQUESTED",
    },
  });

  return NextResponse.json(
    {
      hire: {
        id: hire.id,
        scope: hire.scope,
        price: hire.price,
        agreement: hire.agreement,
        status: hire.status,
      },
    },
    { status: 201 }
  );
}
