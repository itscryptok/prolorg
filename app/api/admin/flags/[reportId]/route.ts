import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin";

type Raw = {
  $executeRawUnsafe(query: string, ...params: unknown[]): Promise<number>;
  $queryRawUnsafe(
    query: string,
    ...params: unknown[]
  ): Promise<{ expertId: string; kind: string }[]>;
};

// DELETE /api/admin/flags/[reportId] — dismiss one flag report (admin only).
// Removes the report and decrements the matching counter on the expert
// (member flags → flagCount, payment-practice flags → paymentFlagCount),
// never below zero. Used from /addy when reviewing bogus reports.
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  const { reportId } = await params;
  const db = getDb();
  if (!db)
    return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  const raw = db as unknown as Raw;

  const rows = await raw.$queryRawUnsafe(
    'SELECT "expertId", "kind" FROM "FlagReport" WHERE "id" = $1',
    reportId
  );
  const report = rows[0];
  if (!report) {
    return NextResponse.json({ error: "Flag report not found." }, { status: 404 });
  }

  await raw.$executeRawUnsafe('DELETE FROM "FlagReport" WHERE "id" = $1', reportId);
  const counter =
    report.kind === "PAYMENT" ? '"paymentFlagCount"' : '"flagCount"';
  await raw.$executeRawUnsafe(
    `UPDATE "ExpertProfile" SET ${counter} = GREATEST(0, ${counter} - 1) WHERE "id" = $1`,
    report.expertId
  );
  return NextResponse.json({ ok: true });
}
