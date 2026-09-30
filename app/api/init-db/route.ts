import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

/**
 * ONE-TIME setup endpoint: creates the separate `prolorg` database on the
 * existing Postgres server. Protected by INIT_TOKEN; removed after use.
 *
 * POST /api/init-db  { "token": "...", "adminUrl": "postgresql://.../emus_db" }
 *
 * The adminUrl must point at an existing database on the same server (it is
 * only used to issue CREATE DATABASE). This endpoint refuses to run unless
 * the target name is exactly `prolorg`.
 */
export async function POST(req: NextRequest) {
  const expected = process.env.INIT_TOKEN;
  let body: { token?: string; adminUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  if (!expected || body.token !== expected) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const adminUrl = body.adminUrl;
  if (!adminUrl || !adminUrl.startsWith("postgresql://")) {
    return NextResponse.json({ error: "adminUrl required" }, { status: 400 });
  }

  const prevUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = adminUrl;
  const db = new PrismaClient();
  try {
    const existing = await db.$queryRaw<
      Array<{ datname: string }>
    >`SELECT datname FROM pg_database WHERE datname = 'prolorg'`;
    if (existing.length > 0) {
      return NextResponse.json({ ok: true, created: false });
    }
    await db.$executeRawUnsafe("CREATE DATABASE prolorg");
    return NextResponse.json({ ok: true, created: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  } finally {
    if (prevUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = prevUrl;
    await db.$disconnect();
  }
}
