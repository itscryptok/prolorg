import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin";

type Raw = {
  $executeRawUnsafe(query: string, ...params: unknown[]): Promise<number>;
};

const STATUSES = new Set(["APPROVED", "REJECTED"]);

// Approve/reject/delete an expert profile. Admin only.
// Raw SQL keeps this independent of the generated client version.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  const { id } = await params;
  let status = "";
  try {
    status = String(((await req.json()) as { status?: unknown }).status ?? "").toUpperCase();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!STATUSES.has(status)) {
    return NextResponse.json({ error: "Status must be APPROVED or REJECTED." }, { status: 400 });
  }

  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  const updated = await (db as unknown as Raw).$executeRawUnsafe(
    'UPDATE "ExpertProfile" SET "status" = $2 WHERE "id" = $1',
    id,
    status
  );
  if (!updated) return NextResponse.json({ error: "Expert not found." }, { status: 404 });
  return NextResponse.json({ ok: true, status });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  const { id } = await params;
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  const raw = db as unknown as Raw;
  await raw.$executeRawUnsafe('DELETE FROM "ExpertMedia" WHERE "expertId" = $1', id);
  const deleted = await raw.$executeRawUnsafe('DELETE FROM "ExpertProfile" WHERE "id" = $1', id);
  if (!deleted) return NextResponse.json({ error: "Expert not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
