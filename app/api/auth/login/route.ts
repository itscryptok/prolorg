import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { createSession, sessionSetCookie } from "@/lib/auth";
import { users, publicUser } from "@/lib/users";
import { rateLimit, clientKey } from "@/lib/ratelimit";

// POST /api/auth/login — { email, password }
export async function POST(req: Request) {
  if (!rateLimit(clientKey(req, "login"), 10, 60_000)) {
    return NextResponse.json({ error: "Too many attempts — try again in a minute." }, { status: 429 });
  }
  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  }

  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const wrong = NextResponse.json(
    { error: "Email or password is incorrect." },
    { status: 401 }
  );

  const user = await users(db).findUnique({ where: { email } });
  if (!user || !user.passwordHash) return wrong;
  if (user.isBlocked) {
    return NextResponse.json(
      { error: "This account has been blocked. Contact support@aiprolice.com." },
      { status: 403 }
    );
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return wrong;

  const token = await createSession(user.id);
  const res = NextResponse.json({ user: publicUser(user) });
  res.headers.set("Set-Cookie", sessionSetCookie(token));
  return res;
}
