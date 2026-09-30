import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Public content pages only — auth and stub pages are deliberately excluded.
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/about", "/how-it-works", "/terms", "/privacy"];
  return pages.map((p) => ({
    url: `${SITE_URL}${p || "/"}`,
    lastModified: new Date(),
    changeFrequency: p === "" ? "weekly" : "monthly",
    priority: p === "" ? 1 : 0.7,
  }));
}
