import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin";
import { raw } from "@/lib/inbox";

type MemberRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  isBlocked: boolean;
  createdAt: Date;
  violationCount: number;
  profileId: string | null;
  profileSlug: string | null;
  profileStatus: string | null;
  profileDeactivated: boolean | null;
  profileSeed: boolean | null;
};

// GET /api/admin/users — full member roster for the /addy Members tab.
// One row per account: role, blocked status, linked AI pro profile summary,
// and violation count. Paginated (?page, ?pageSize, max 100). Admin only.
export async function GET(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  }

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(url.searchParams.get("pageSize") ?? "25", 10) || 25)
  );
  const offset = (page - 1) * pageSize;

  const totalRows = await raw<{ count: number }>(
    db,
    `SELECT COUNT(*)::int AS "count" FROM "User"`
  );
  const users = await raw<MemberRow>(
    db,
    `SELECT u."id", u."name", u."email", u."role", u."isBlocked", u."createdAt",
            (SELECT COUNT(*)::int FROM "Violation" v WHERE v."userId" = u."id") AS "violationCount",
            p."id" AS "profileId", p."slug" AS "profileSlug", p."status" AS "profileStatus",
            p."isDeactivated" AS "profileDeactivated", p."isSeed" AS "profileSeed"
     FROM "User" u
     LEFT JOIN "ExpertProfile" p ON p."userId" = u."id"
     ORDER BY u."createdAt" DESC
     LIMIT ${pageSize} OFFSET ${offset}`
  );

  return NextResponse.json({
    users,
    total: totalRows[0]?.count ?? 0,
    page,
    pageSize,
  });
}
