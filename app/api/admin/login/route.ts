import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ADMIN_COOKIE, expectedAdminToken } from "@/lib/admin";

// REMU-style admin login: password only, show/hide toggle on the form.
// Sets a stateless httpOnly session cookie on success.
export async function POST(req: Request) {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) {
    return NextResponse.json(
      { error: "Admin login is not configured yet." },
      { status: 503 }
    );
  }

  let password = "";
  try {
    password = String(((await req.json()) as { password?: unknown }).password ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const ok = password.length > 0 && (await bcrypt.compare(password, hash));
  if (!ok) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }

  const token = expectedAdminToken();
  if (!token) {
    return NextResponse.json({ error: "Admin login is not configured yet." }, { status: 503 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
  return res;
}
