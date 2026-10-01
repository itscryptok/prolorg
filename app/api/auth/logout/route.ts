import { NextResponse } from "next/server";
import { destroySession, sessionClearCookie } from "@/lib/auth";

// POST /api/auth/logout — revoke the current session.
export async function POST(req: Request) {
  await destroySession(req);
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", sessionClearCookie());
  return res;
}
