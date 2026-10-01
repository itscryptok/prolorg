import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { inbox, raw } from "@/lib/inbox";

type ConvoRow = { id: string; clientId: string; expertId: string };

// Hire status progression (Big/MVP):
//   REQUESTED → ACCEPTED → IN_PROGRESS → COMPLETED
//   REQUESTED → CANCELLED · ACCEPTED → CANCELLED
//
// Who can do what:
//   accept / decline — the AI pro, on REQUESTED
//   start           — either side, on ACCEPTED
//   complete        — either side, on IN_PROGRESS (or ACCEPTED)
//   cancel          — either side, on REQUESTED / ACCEPTED

const TRANSITIONS: Record<string, { from: string[]; to: string; actor: "expert" | "any" }> = {
  accept: { from: ["REQUESTED"], to: "ACCEPTED", actor: "expert" },
  decline: { from: ["REQUESTED"], to: "CANCELLED", actor: "expert" },
  start: { from: ["ACCEPTED"], to: "IN_PROGRESS", actor: "any" },
  complete: { from: ["ACCEPTED", "IN_PROGRESS"], to: "COMPLETED", actor: "any" },
  cancel: { from: ["REQUESTED", "ACCEPTED"], to: "CANCELLED", actor: "any" },
};

// PATCH /api/hires/[id] — Body: { action: "accept"|"decline"|"start"|"complete"|"cancel" }
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database unavailable." }, { status: 503 });

  let body: { action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const action = body.action ?? "";
  const rule = TRANSITIONS[action];
  if (!rule) {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  const { id } = await params;
  const ix = inbox(db);
  const hire = await ix.hireRequest.findUnique({ where: { id } });
  if (!hire) return NextResponse.json({ error: "Hire request not found." }, { status: 404 });

  const convos = await raw<ConvoRow>(
    db,
    `SELECT "id", "clientId", "expertId" FROM "Conversation" WHERE "id" = $1 LIMIT 1`,
    hire.conversationId
  );
  const convo = convos[0];
  if (!convo) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });

  const isClient = convo.clientId === user.id;
  const isExpert = convo.expertId === user.id;
  if (!isClient && !isExpert) {
    return NextResponse.json({ error: "Not part of this conversation." }, { status: 403 });
  }
  if (rule.actor === "expert" && !isExpert) {
    return NextResponse.json({ error: "Only the AI pro can do that." }, { status: 403 });
  }
  if (!rule.from.includes(hire.status)) {
    return NextResponse.json(
      { error: `Can't ${action} a hire that is ${hire.status.toLowerCase()}.` },
      { status: 400 }
    );
  }

  const updated = await ix.hireRequest.update({ where: { id }, data: { status: rule.to } });

  // A completed hire counts toward the AI pro's track record.
  if (rule.to === "COMPLETED") {
    await raw(
      db,
      `UPDATE "ExpertProfile" SET "completedJobs" = "completedJobs" + 1, "updatedAt" = CURRENT_TIMESTAMP WHERE "userId" = $1`,
      convo.expertId
    );
  }

  return NextResponse.json({ hire: { id: updated.id, status: updated.status } });
}
