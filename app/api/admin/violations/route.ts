import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin";
import { raw } from "@/lib/inbox";

type ViolationListRow = {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userBlocked: boolean;
  userViolationCount: number;
  conversationId: string | null;
  reasons: string;
  excerpt: string;
  createdAt: Date;
};

// GET /api/admin/violations — recent contact-evasion violations with the
// offender's account and their total violation count (spot repeat
// offenders). Admin only.
export async function GET(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  }

  const rows = await raw<ViolationListRow>(
    db,
    `SELECT v."id", v."userId", u."email" AS "userEmail", u."name" AS "userName",
            u."isBlocked" AS "userBlocked",
            (SELECT COUNT(*)::int FROM "Violation" v2 WHERE v2."userId" = v."userId") AS "userViolationCount",
            v."conversationId", v."reasons", v."excerpt", v."createdAt"
     FROM "Violation" v
     JOIN "User" u ON u."id" = v."userId"
     ORDER BY v."createdAt" DESC
     LIMIT 100`
  );

  return NextResponse.json({
    violations: rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      userEmail: r.userEmail,
      userName: r.userName,
      userBlocked: r.userBlocked,
      userViolationCount: r.userViolationCount,
      conversationId: r.conversationId,
      reasons: r.reasons,
      excerpt: r.excerpt,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
    })),
  });
}
