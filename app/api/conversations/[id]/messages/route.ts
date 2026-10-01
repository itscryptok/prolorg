import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { inbox, raw } from "@/lib/inbox";
import { detectContactEvasion, evasionWarning } from "@/lib/evasion";
import { rateLimit, clientKey } from "@/lib/ratelimit";

type ThreadRow = {
  id: string;
  clientId: string;
  expertId: string;
  unlockedContact: boolean;
  clientName: string;
  expertName: string;
  expertHeadline: string | null;
  expertSlug: string | null;
};

async function loadThread(db: Parameters<typeof raw>[0], id: string, userId: string) {
  const rows = await raw<ThreadRow>(
    db,
    `SELECT c."id", c."clientId", c."expertId", c."unlockedContact",
            cl."name" AS "clientName", ex."name" AS "expertName",
            ep."headline" AS "expertHeadline", ep."slug" AS "expertSlug"
     FROM "Conversation" c
     JOIN "User" cl ON cl."id" = c."clientId"
     JOIN "User" ex ON ex."id" = c."expertId"
     LEFT JOIN "ExpertProfile" ep ON ep."userId" = c."expertId"
     WHERE c."id" = $1 AND (c."clientId" = $2 OR c."expertId" = $2)
     LIMIT 1`,
    id,
    userId
  );
  return rows[0] ?? null;
}

// GET /api/conversations/[id]/messages — thread view (participant only).
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database unavailable." }, { status: 503 });

  const { id } = await params;
  const thread = await loadThread(db, id, user.id);
  if (!thread) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });

  const ix = inbox(db);
  const messages = await ix.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
  });
  const hires = await ix.hireRequest.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    conversation: {
      id: thread.id,
      unlockedContact: thread.unlockedContact,
      clientName: thread.clientName,
      expertName: thread.expertName,
      expertHeadline: thread.expertHeadline,
      expertSlug: thread.expertSlug,
      myRole: user.id === thread.clientId ? "CLIENT" : "EXPERT",
    },
    messages: messages.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      mine: m.senderId === user.id,
      body: m.body,
      flagged: m.flagged,
      createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : String(m.createdAt),
    })),
    hires: hires.map((h) => ({
      id: h.id,
      scope: h.scope,
      price: h.price,
      agreement: h.agreement,
      status: h.status,
      createdAt: h.createdAt instanceof Date ? h.createdAt.toISOString() : String(h.createdAt),
    })),
  });
}

// POST /api/conversations/[id]/messages — send a message. Body: { body }
// Contact-evasion detection runs on every message; flagged messages are
// still delivered but logged as violations and the sender sees a warning.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!rateLimit(clientKey(req, "msg"), 30, 60_000)) {
    return NextResponse.json({ error: "Slow down — too many messages." }, { status: 429 });
  }
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database unavailable." }, { status: 503 });

  const { id } = await params;
  const thread = await loadThread(db, id, user.id);
  if (!thread) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });

  let body: { body?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const text = (body.body ?? "").trim();
  if (!text) return NextResponse.json({ error: "Write a message first." }, { status: 400 });
  if (text.length > 5000) {
    return NextResponse.json({ error: "Message is too long (5,000 characters max)." }, { status: 400 });
  }

  const finding = detectContactEvasion(text);
  const ix = inbox(db);
  const message = await ix.message.create({
    data: { conversationId: id, senderId: user.id, body: text, flagged: finding.flagged },
  });

  let warning: string | null = null;
  if (finding.flagged) {
    warning = evasionWarning(finding.reasons);
    await ix.violation.create({
      data: {
        userId: user.id,
        conversationId: id,
        messageId: message.id,
        reasons: finding.reasons.join(","),
        excerpt: text.slice(0, 200),
      },
    });
  }

  return NextResponse.json(
    {
      message: {
        id: message.id,
        senderId: message.senderId,
        mine: true,
        body: message.body,
        flagged: message.flagged,
        createdAt:
          message.createdAt instanceof Date
            ? message.createdAt.toISOString()
            : String(message.createdAt),
      },
      flagged: finding.flagged,
      warning,
    },
    { status: 201 }
  );
}
