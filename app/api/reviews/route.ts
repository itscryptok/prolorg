import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { inbox, raw } from "@/lib/inbox";

type HireConvoRow = {
  hireId: string;
  status: string;
  clientId: string;
  expertUserId: string;
  expertProfileId: string | null;
};

// POST /api/reviews — the client reviews a COMPLETED hire.
// Reviews appear on the AI pro's profile. One review per hire.
export async function POST(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database unavailable." }, { status: 503 });

  let body: { hireRequestId?: string; rating?: number; comment?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const rating = body.rating;
  const comment = (body.comment ?? "").trim() || null;
  if (!body.hireRequestId) {
    return NextResponse.json({ error: "Hire request is required." }, { status: 400 });
  }
  if (!Number.isInteger(rating) || (rating as number) < 1 || (rating as number) > 5) {
    return NextResponse.json({ error: "Rating must be 1 to 5 stars." }, { status: 400 });
  }
  if (comment && comment.length > 2000) {
    return NextResponse.json({ error: "Review is too long (2,000 characters max)." }, { status: 400 });
  }

  const rows = await raw<HireConvoRow>(
    db,
    `SELECT h."id" AS "hireId", h."status", c."clientId", c."expertId" AS "expertUserId",
            ep."id" AS "expertProfileId"
     FROM "HireRequest" h
     JOIN "Conversation" c ON c."id" = h."conversationId"
     LEFT JOIN "ExpertProfile" ep ON ep."userId" = c."expertId"
     WHERE h."id" = $1
     LIMIT 1`,
    body.hireRequestId
  );
  const row = rows[0];
  if (!row) return NextResponse.json({ error: "Hire request not found." }, { status: 404 });
  if (row.clientId !== user.id) {
    return NextResponse.json({ error: "Only the hiring client can review this job." }, { status: 403 });
  }
  if (row.status !== "COMPLETED") {
    return NextResponse.json(
      { error: "You can review this hire once it's completed." },
      { status: 400 }
    );
  }

  const ix = inbox(db);
  const existing = await ix.review.findFirst({ where: { hireRequestId: row.hireId } });
  if (existing) {
    return NextResponse.json({ error: "This hire already has a review." }, { status: 409 });
  }

  const review = await ix.review.create({
    data: { hireRequestId: row.hireId, authorId: user.id, rating: rating as number, comment },
  });

  // Recompute the AI pro's aggregate rating from completed hires.
  if (row.expertProfileId) {
    await raw(
      db,
      `UPDATE "ExpertProfile" ep
       SET "reviewCount" = sub.cnt,
           "ratingAvg" = sub.avg,
           "updatedAt" = CURRENT_TIMESTAMP
       FROM (
         SELECT COUNT(*)::int AS cnt, COALESCE(AVG(r."rating"), 0) AS avg
         FROM "Review" r
         JOIN "HireRequest" h ON h."id" = r."hireRequestId"
         JOIN "Conversation" c ON c."id" = h."conversationId"
         JOIN "ExpertProfile" e2 ON e2."userId" = c."expertId"
         WHERE e2."id" = $1 AND h."status" = 'COMPLETED'
       ) AS sub
       WHERE ep."id" = $1`,
      row.expertProfileId
    );
  }

  return NextResponse.json(
    {
      review: {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
      },
    },
    { status: 201 }
  );
}
