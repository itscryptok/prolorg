import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

// Raw-SQL access: the local generated Prisma client is stale (production
// regenerates it at build time), so inserts/updates use raw queries.
type Raw = {
  $executeRawUnsafe(query: string, ...params: unknown[]): Promise<number>;
  $queryRawUnsafe(query: string, ...params: unknown[]): Promise<
    { flagCount: number }[]
  >;
};

// POST /api/experts/[id]/flag — records one "Flag this pro" member report.
// Body: { reporterName: string, details: string } — both required, collected
// via the popup on the public view. The reporter MUST be a signed-in member
// (Yemi 2026-10-02): anonymous flags are rejected with 401, so the popup's
// login gate can't be bypassed by posting directly. The reporter must be a
// member other than the pro (the popup asks for their username; signed-in
// users are prefilled and linked by id).
//
// The client de-dupes per browser via localStorage (one flag per browser,
// same approach as /watch likes). Reaching FLAG_THRESHOLD (lib/moderation.ts)
// does NOT auto-deactivate: it only highlights the pro in /addy ("needs
// your review") so a human decides. Member flags are stored separately from
// auto-detected payment-practice flags and are never exposed publicly; they
// appear only in the /addy admin dashboard with the reporter's username and
// details.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database unavailable." }, { status: 503 });

  let body: { reporterName?: string; details?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Tell us your name and what happened." },
      { status: 400 }
    );
  }
  const reporterName = (body.reporterName ?? "").trim().slice(0, 80);
  const details = (body.details ?? "").trim().slice(0, 2000);
  if (!reporterName || !details) {
    return NextResponse.json(
      { error: "Your name and details are both required." },
      { status: 400 }
    );
  }

  // Flags require a signed-in member — no anonymous reports.
  let reporterId: string | null = null;
  try {
    const user = await getSessionUser(req);
    reporterId = user?.id ?? null;
  } catch {
    /* treated as anonymous below */
  }
  if (!reporterId) {
    return NextResponse.json({ error: "Log in to send a flag." }, { status: 401 });
  }

  const raw = db as unknown as Raw;
  const reportId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const updated = await raw.$executeRawUnsafe(
    `UPDATE "ExpertProfile"
     SET "flagCount" = "flagCount" + 1
     WHERE "id" = $1`,
    id
  );
  if (!updated) {
    return NextResponse.json({ error: "AI pro not found." }, { status: 404 });
  }
  await raw.$executeRawUnsafe(
    `INSERT INTO "FlagReport"
       ("id", "expertId", "kind", "reporterName", "reporterId", "details", "createdAt")
     VALUES ($1, $2, 'USER', $3, $4, $5, NOW())`,
    reportId,
    id,
    reporterName,
    reporterId,
    details
  );

  const rows = await raw.$queryRawUnsafe(
    'SELECT "flagCount" FROM "ExpertProfile" WHERE "id" = $1',
    id
  );
  return NextResponse.json({ flagCount: rows[0]?.flagCount ?? 0 });
}
