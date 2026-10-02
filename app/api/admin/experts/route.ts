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
  paymentFlagCount: number;
  isDeactivated: boolean;
  isSeed: boolean;
  createdAt: Date;
};

type FlagReportRow = {
  id: string;
  expertId: string;
  kind: string;
  reporterName: string | null;
  details: string | null;
  reasons: string | null;
  createdAt: Date;
};

// GET /api/admin/experts — every AI pro with separated flag counts
// (member flags vs payment-practice flags) plus their recent flag reports,
// for the /addy "AI pros" moderation tab. Admin only.
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
            "flagCount", "paymentFlagCount", "isDeactivated", "isSeed", "createdAt"
     FROM "ExpertProfile"
     ORDER BY "paymentFlagCount" DESC, "flagCount" DESC, "createdAt" DESC`
  );

  const reports = await raw<FlagReportRow>(
    db,
    `SELECT "id", "expertId", "kind", "reporterName", "details", "reasons", "createdAt"
     FROM "FlagReport"
     ORDER BY "createdAt" DESC
     LIMIT 500`
  );
  const byExpert = new Map<string, FlagReportRow[]>();
  for (const r of reports) {
    const list = byExpert.get(r.expertId) ?? [];
    list.push(r);
    byExpert.set(r.expertId, list);
  }

  const toReport = (r: FlagReportRow) => ({
    id: r.id,
    kind: r.kind,
    reporterName: r.reporterName,
    details: r.details,
    reasons: r.reasons,
    createdAt:
      r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
  });

  return NextResponse.json({
    experts: rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      headline: r.headline,
      specialty: r.specialty,
      status: r.status,
      flagCount: r.flagCount,
      paymentFlagCount: r.paymentFlagCount,
      isDeactivated: r.isDeactivated,
      isSeed: r.isSeed,
      createdAt:
        r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
      flagReports: (byExpert.get(r.id) ?? []).map(toReport),
    })),
  });
}
