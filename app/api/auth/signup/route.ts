import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { createSession, sessionSetCookie } from "@/lib/auth";
import { users, publicUser, isValidEmail } from "@/lib/users";
import { rateLimit, clientKey } from "@/lib/ratelimit";

// Verify a Cloudflare Turnstile token server-side (Yemi 2026-10-03).
// Until TURNSTILE_SECRET_KEY is installed in the environment, verification
// is skipped (with a warning) so signup keeps working during setup.
async function verifyTurnstile(token: string | undefined): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.warn("[signup] TURNSTILE_SECRET_KEY not set — skipping CAPTCHA verification");
    return true;
  }
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

// POST /api/auth/signup — create a CLIENT or EXPERT account.
// Body: { name, email, password, role: "client" | "expert", turnstileToken? }
export async function POST(req: Request) {
  if (!rateLimit(clientKey(req, "signup"), 10, 60_000)) {
    return NextResponse.json({ error: "Too many attempts — try again in a minute." }, { status: 429 });
  }
  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  }

  let body: { name?: string; email?: string; password?: string; role?: string; turnstileToken?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!(await verifyTurnstile(body.turnstileToken))) {
    return NextResponse.json({ error: "CAPTCHA check failed — please try again." }, { status: 403 });
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const role = (body.role ?? "").trim().toUpperCase();

  if (name.length < 2) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }
  if (role !== "CLIENT" && role !== "EXPERT") {
    return NextResponse.json({ error: "Choose whether you're signing up as a client or an AI pro." }, { status: 400 });
  }

  const existing = await users(db).findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with that email already exists. Try logging in instead." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await users(db).create({
    data: { email, name, role, passwordHash },
  });

  const token = await createSession(user.id);
  const res = NextResponse.json({ user: publicUser(user) }, { status: 201 });
  res.headers.set("Set-Cookie", sessionSetCookie(token));
  return res;
}
