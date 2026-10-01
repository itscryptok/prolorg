import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { inbox, raw } from "@/lib/inbox";
import { users } from "@/lib/users";

type ConversationListRow = {
  id: string;
  createdAt: Date;
  unlockedContact: boolean;
  otherName: string;
  otherRole: string;
  expertHeadline: string | null;
  expertSlug: string | null;
  lastMessage: string | null;
  lastMessageAt: Date | null;
};

// GET /api/conversations — the signed-in user's inbox list.
export async function GET(req: Request) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  }

  const rows = await raw<ConversationListRow>(
    db,
    `SELECT c."id", c."createdAt", c."unlockedContact",
            other."name" AS "otherName", other."role" AS "otherRole",
            ep."headline" AS "expertHeadline", ep."slug" AS "expertSlug",
            (SELECT m."body" FROM "Message" m WHERE m."conversationId" = c."id" ORDER BY m."createdAt" DESC LIMIT 1) AS "lastMessage",
            (SELECT m."createdAt" FROM "Message" m WHERE m."conversationId" = c."id" ORDER BY m."createdAt" DESC LIMIT 1) AS "lastMessageAt"
     FROM "Conversation" c
     JOIN "User" other ON other."id" = CASE WHEN c."clientId" = $1 THEN c."expertId" ELSE c."clientId" END
     LEFT JOIN "ExpertProfile" ep ON ep."userId" = c."expertId"
     WHERE c."clientId" = $1 OR c."expertId" = $1
     ORDER BY COALESCE(
       (SELECT MAX(m."createdAt") FROM "Message" m WHERE m."conversationId" = c."id"),
       c."createdAt"
     ) DESC`,
    user.id
  );

  return NextResponse.json({
    conversations: rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
      unlockedContact: r.unlockedContact,
      otherName: r.otherName,
      otherRole: r.otherRole,
      expertHeadline: r.expertHeadline,
      expertSlug: r.expertSlug,
      lastMessage: r.lastMessage,
      lastMessageAt:
        r.lastMessageAt instanceof Date ? r.lastMessageAt.toISOString() : r.lastMessageAt ? String(r.lastMessageAt) : null,
    })),
  });
}

// POST /api/conversations — client starts (or reopens) a conversation
// with an AI pro. Body: { expertProfileId }
export async function POST(req: Request) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  if (user.role !== "CLIENT") {
    return NextResponse.json(
      { error: "Only client accounts can start conversations." },
      { status: 403 }
    );
  }
  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  }

  let body: { expertProfileId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!body.expertProfileId) {
    return NextResponse.json({ error: "Choose an AI pro first." }, { status: 400 });
  }

  const ix = inbox(db);
  const profile = await ix.expertProfile.findFirst({
    where: { id: body.expertProfileId, status: "APPROVED" },
  });
  if (!profile) {
    return NextResponse.json({ error: "AI pro not found." }, { status: 404 });
  }
  if (!profile.userId) {
    return NextResponse.json(
      { error: "This AI pro hasn't activated their inbox yet — try another pro." },
      { status: 400 }
    );
  }
  const expertUser = await users(db).findUnique({ where: { id: profile.userId } });
  if (!expertUser || expertUser.isBlocked) {
    return NextResponse.json({ error: "This AI pro is unavailable right now." }, { status: 400 });
  }
  if (expertUser.id === user.id) {
    return NextResponse.json({ error: "You can't message yourself." }, { status: 400 });
  }

  let convo = await ix.conversation.findFirst({
    where: { clientId_expertId: { clientId: user.id, expertId: expertUser.id } },
  });
  if (!convo) {
    convo = await ix.conversation.create({
      data: { clientId: user.id, expertId: expertUser.id },
    });
  }
  return NextResponse.json({ conversationId: convo.id });
}
