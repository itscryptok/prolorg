import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getDb } from "@/lib/db";

// Public content pages only — auth and stub pages are deliberately excluded.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ["", "/about", "/how-it-works", "/experts", "/watch", "/join", "/terms", "/privacy"];
  const entries: MetadataRoute.Sitemap = pages.map((p) => ({
    url: `${SITE_URL}${p || "/"}`,
    lastModified: new Date(),
    changeFrequency: p === "" ? "weekly" : p === "/experts" ? "daily" : "monthly",
    priority: p === "" ? 1 : p === "/experts" ? 0.9 : 0.7,
  }));

  // Approved expert profiles get their own URLs for discovery.
  const db = getDb();
  if (db) {
    const { hideSeedProfiles } = await import("@/lib/seed");
    const where: Record<string, unknown> = { status: "APPROVED" };
    if (await hideSeedProfiles()) where.isSeed = false;
    const profiles = await db.expertProfile.findMany({
      where: where as never,
      select: { slug: true, updatedAt: true },
    });
    for (const p of profiles) {
      entries.push({
        url: `${SITE_URL}/experts/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  }
  return entries;
}
