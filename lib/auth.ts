import { createHash, randomBytes } from "crypto";
import { getDb } from "./db";

// Prolice AI user sessions (Big/MVP stage).
//
// The session token lives in an httpOnly, SameSite=Lax cookie
// ("prolorg_session"); only its SHA-256 hash is stored in the Session
// table, so a database leak never exposes usable tokens. Sessions last
// 30 days and are revoked on logout or when the account is blocked.

export const SESSION_COOKIE = "prolorg_session";
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "CLIENT" | "EXPERT" | "ADMIN";
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function readCookie(req: Request, name: string): string | null {
  const header = req.headers.get("cookie") ?? "";
  const m = new RegExp(`(?:^|;\\s*)${name}=([^;]+)`).exec(header);
  return m ? decodeURIComponent(m[1]) : null;
}

// Narrow typed access to the Session delegate (local generated Prisma
// client is stale in dev; production regenerates it at build time).
type SessionRow = {
  tokenHash: string;
  userId: string;
  expiresAt: Date;
  user: { id: string; email: string; name: string; role: string; isBlocked: boolean };
};
type SessionDelegate = {
  create(args: {
    data: { tokenHash: string; userId: string; expiresAt: Date };
  }): Promise<unknown>;
  findUnique(args: {
    where: { tokenHash: string };
    include: { user: true };
  }): Promise<SessionRow | null>;
  deleteMany(args: { where: { tokenHash: string } }): Promise<unknown>;
};

function sessions(db: object): SessionDelegate {
  return (db as unknown as { session: SessionDelegate }).session;
}

export async function createSession(userId: string): Promise<string> {
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");
  const token = randomBytes(32).toString("hex");
  await sessions(db).create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt: new Date(Date.now() + SESSION_TTL_SECONDS * 1000),
    },
  });
  return token;
}

export function sessionSetCookie(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}${secure}`;
}

export function sessionClearCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export async function destroySession(req: Request): Promise<void> {
  const token = readCookie(req, SESSION_COOKIE);
  const db = getDb();
  if (!token || !db) return;
  await sessions(db).deleteMany({ where: { tokenHash: hashToken(token) } });
}

// Returns the logged-in user for a raw Cookie header (for server
// components via next/headers), or null.
export async function getSessionUserFromCookies(
  cookieHeader: string | null
): Promise<SessionUser | null> {
  if (!cookieHeader) return null;
  return getSessionUser(new Request("http://localhost/", { headers: { cookie: cookieHeader } }));
}

// Returns the logged-in user for this request, or null. Blocked accounts
// and expired sessions are treated as logged out.
export async function getSessionUser(req: Request): Promise<SessionUser | null> {
  const token = readCookie(req, SESSION_COOKIE);
  const db = getDb();
  if (!token || !db) return null;
  let row: SessionRow | null = null;
  try {
    row = await sessions(db).findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: true },
    });
  } catch {
    return null;
  }
  if (!row) return null;
  if (row.expiresAt.getTime() < Date.now()) return null;
  if (row.user.isBlocked) return null;
  return {
    id: row.user.id,
    email: row.user.email,
    name: row.user.name,
    role: row.user.role as SessionUser["role"],
  };
}
