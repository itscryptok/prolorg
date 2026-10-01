import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin";
import { users } from "@/lib/users";

// PATCH /api/admin/users/[id] — block or unblock an account
// (repeat contact-evasion offenders). Body: { isBlocked: boolean }.
// Admin only. Blocked accounts can't log in and existing sessions stop
// working.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  }

  let body: { isBlocked?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (typeof body.isBlocked !== "boolean") {
    return NextResponse.json({ error: "isBlocked must be true or false." }, { status: 400 });
  }

  const { id } = await params;
  const user = await users(db).findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  const updated = await users(db).update({ where: { id }, data: { isBlocked: body.isBlocked } });
  return NextResponse.json({
    user: { id: updated.id, email: updated.email, name: updated.name, isBlocked: updated.isBlocked },
  });
}
