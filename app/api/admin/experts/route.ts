import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin";
import { raw } from "@/lib/inbox";

type ExpertAdminRow = {
  id: string;
  slug: string;
  name: string;
  headline: string;
  specialty: string;
  status: string;
  flagCount: number;
  isDeactivated: boolean;
  createdAt: Date;
};

// GET /api/admin/experts — every AI pro with flag counts and deactivation
// state, for the /addy "AI pros" moderation tab. Admin only.
export async function GET(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  }

  const rows = await raw<ExpertAdminRow>(
    db,
    `SELECT "id", "slug", "name", "headline", "specialty", "status",
            "flagCount", "isDeactivated", "createdAt"
     FROM "ExpertProfile"
     ORDER BY "flagCount" DESC, "createdAt" DESC`
  );

  return NextResponse.json({
    experts: rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      headline: r.headline,
      specialty: r.specialty,
      status: r.status,
      flagCount: r.flagCount,
      isDeactivated: r.isDeactivated,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
    })),
  });
}
