import { getDb } from "@/lib/db";

// Test/seed profiles (marked via /addy) stay visible as demo content until
// 10 real humans have signed up; after that they are hidden from the public
// directory and /watch. Synthetic test accounts use @example.com emails and
// are excluded from the human count. (Yemi 2026-10-02)
export async function hideSeedProfiles(): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  try {
    const humans = await db.user.count({
      where: { NOT: { email: { endsWith: "@example.com" } } },
    });
    return humans >= 10;
  } catch {
    return false;
  }
}
