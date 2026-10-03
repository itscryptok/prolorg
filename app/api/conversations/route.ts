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
// with an AI pro. Body: { expertSlug } (preferred) or { expertProfileId }.
// Returns { conversation: { id } }.
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

  let body: { expertProfileId?: string; expertSlug?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const ix = inbox(db);

  // The "Message AI pro" button sends { expertSlug }; accept a profile id too.
  let profile = null;
  if (body.expertSlug) {
    profile = await ix.expertProfile.findFirst({
      where: { slug: body.expertSlug, status: "APPROVED", isDeactivated: false },
    });
  } else if (body.expertProfileId) {
    profile = await ix.expertProfile.findFirst({
      where: { id: body.expertProfileId, status: "APPROVED", isDeactivated: false },
    });
  }
  if (!profile) {
    return NextResponse.json(
      { error: body.expertSlug || body.expertProfileId ? "AI pro not found." : "Choose an AI pro first." },
      { status: body.expertSlug || body.expertProfileId ? 404 : 400 }
    );
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
  return NextResponse.json({ conversation: { id: convo.id } });
}
