import { createHmac, timingSafeEqual } from "crypto";

// REMU-style single-admin gate: the admin password never leaves the server
// as plaintext — only its bcrypt hash lives in ADMIN_PASSWORD_HASH. A
// successful login sets an httpOnly cookie holding an HMAC derived from that
// hash, so sessions are stateless and survive service restarts.
export const ADMIN_COOKIE = "prolorg_admin";
const TOKEN_CONTEXT = "prolorg-admin-v1";

export function expectedAdminToken(): string | null {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) return null;
  return createHmac("sha256", hash).update(TOKEN_CONTEXT).digest("hex");
}

function readCookie(req: Request, name: string): string | null {
  const header = req.headers.get("cookie") ?? "";
  const m = new RegExp(`(?:^|;\\s*)${name}=([^;]+)`).exec(header);
  return m ? decodeURIComponent(m[1]) : null;
}

export function isAdminRequest(req: Request): boolean {
  const expected = expectedAdminToken();
  if (!expected) return false;
  const got = readCookie(req, ADMIN_COOKIE);
  if (!got) return false;
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
