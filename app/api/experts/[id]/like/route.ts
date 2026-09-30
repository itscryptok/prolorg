import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// Raw-SQL access: the local generated Prisma client is stale (production
// regenerates it at build time), so likesCount is adjusted without the
// model delegate.
async function adjustLikes(id: string, delta: 1 | -1): Promise<number | null> {
  const db = getDb();
  if (!db) return null;
  const raw = db as unknown as {
    $executeRawUnsafe(query: string, ...params: unknown[]): Promise<number>;
    $queryRawUnsafe(query: string, ...params: unknown[]): Promise<{ likesCount: number }[]>;
  };
  const updated = await raw.$executeRawUnsafe(
    'UPDATE "ExpertProfile" SET "likesCount" = GREATEST(0, "likesCount" + $2) WHERE "id" = $1',
    id,
    delta
  );
  if (!updated) return null;
  const rows = await raw.$queryRawUnsafe(
    'SELECT "likesCount" FROM "ExpertProfile" WHERE "id" = $1',
    id
  );
  return rows[0]?.likesCount ?? null;
}

// Records a heart tap from /watch. The client de-dupes per browser via
// localStorage; this just keeps the public count honest (never below 0).
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let delta: 1 | -1 = 1;
  try {
    const body = (await req.json()) as { delta?: number };
    delta = body.delta === -1 ? -1 : 1;
  } catch {
    /* default to +1 */
  }

  const likesCount = await adjustLikes(id, delta);
  if (likesCount === null) {
    return NextResponse.json({ error: "Expert not found." }, { status: 404 });
  }
  return NextResponse.json({ likesCount });
}
