import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { FLAG_THRESHOLD } from "@/lib/moderation";

// Raw-SQL access: the local generated Prisma client is stale (production
// regenerates it at build time), so flagCount is adjusted without the
// model delegate.
type Raw = {
  $executeRawUnsafe(query: string, ...params: unknown[]): Promise<number>;
  $queryRawUnsafe(query: string, ...params: unknown[]): Promise<
    { flagCount: number; isDeactivated: boolean }[]
  >;
};

// POST /api/experts/[id]/flag — records one "Flag this pro" report.
// The client de-dupes per browser via localStorage (one flag per browser,
// same approach as /watch likes). When the count reaches FLAG_THRESHOLD
// (lib/moderation.ts) the AI pro is automatically deactivated — hidden
// from /experts and /watch until reactivated in /addy.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  const raw = db as unknown as Raw;

  const updated = await raw.$executeRawUnsafe(
    `UPDATE "ExpertProfile"
     SET "flagCount" = "flagCount" + 1,
         "isDeactivated" = CASE WHEN "flagCount" + 1 >= $2 THEN TRUE ELSE "isDeactivated" END
     WHERE "id" = $1`,
    id,
    FLAG_THRESHOLD
  );
  if (!updated) {
    return NextResponse.json({ error: "AI pro not found." }, { status: 404 });
  }
  const rows = await raw.$queryRawUnsafe(
    'SELECT "flagCount", "isDeactivated" FROM "ExpertProfile" WHERE "id" = $1',
    id
  );
  const row = rows[0];
  return NextResponse.json({
    flagCount: row?.flagCount ?? 0,
    deactivated: row?.isDeactivated ?? false,
  });
}
