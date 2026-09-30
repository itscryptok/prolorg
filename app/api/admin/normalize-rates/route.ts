import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// TEMPORARY one-time route: normalize seeded expert rates to lower ranges.
// Called once with ?key=gjRcwYD6vbMcTtvibOwUtezW5ho_0pjA, then this file is deleted.
const ONE_TIME_KEY = "gjRcwYD6vbMcTtvibOwUtezW5ho_0pjA";

type Raw = {
  $executeRawUnsafe(query: string, ...params: unknown[]): Promise<number>;
  $queryRawUnsafe(query: string, ...params: unknown[]): Promise<unknown[]>;
};

const RATES: Array<[string, number, number]> = [
  // [slug, hourlyRate ($15-75), projectRate ($65-650)]
  ["amara-diallo", 25, 150],
  ["elena-vasquez", 30, 200],
  ["sofia-lindqvist", 35, 250],
  ["kenji-tanaka", 40, 300],
  ["jordan-blake", 45, 350],
  ["priya-nair", 50, 400],
  ["david-okafor", 55, 450],
  ["marcus-reid", 60, 500],
];

export async function POST(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("key") !== ONE_TIME_KEY) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  const raw = db as unknown as Raw;
  const updated: Array<{ slug: string; hourlyRate: number; projectRate: number }> = [];
  for (const [slug, hourly, project] of RATES) {
    await raw.$executeRawUnsafe(
      'UPDATE "ExpertProfile" SET "hourlyRate" = $2, "projectRate" = $3 WHERE "slug" = $1',
      slug,
      hourly,
      project
    );
    updated.push({ slug, hourlyRate: hourly, projectRate: project });
  }
  const rows = (await raw.$queryRawUnsafe(
    'SELECT "slug", "hourlyRate", "projectRate" FROM "ExpertProfile" WHERE "status" = $1 ORDER BY "slug"',
    "APPROVED"
  )) as Array<{ slug: string; hourlyRate: number | null; projectRate: number | null }>;
  return NextResponse.json({ ok: true, updated, current: rows });
}
