import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, expectedAdminToken } from "@/lib/admin";
import AdminLogin from "@/components/AdminLogin";
import AdminDashboard from "@/components/AdminDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

async function isAuthed(): Promise<boolean> {
  const expected = expectedAdminToken();
  if (!expected) return false;
  const jar = await cookies();
  return jar.get(ADMIN_COOKIE)?.value === expected;
}

// Unlisted admin area (like REMU's /addy): password gate, then the expert
// approval queue. Not linked from the nav, sitemap, or robots.
export default async function AdminPage() {
  const authed = await isAuthed();
  return (
    <div className="container admin-wrap">
      {authed ? <AdminDashboard /> : <AdminLogin />}
    </div>
  );
}
