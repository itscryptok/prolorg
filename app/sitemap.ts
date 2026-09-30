import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Public content pages only — auth and stub pages are deliberately excluded.
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/about", "/how-it-works", "/experts", "/watch", "/join", "/terms", "/privacy"];
  return pages.map((p) => ({
    url: `${SITE_URL}${p || "/"}`,
    lastModified: new Date(),
    changeFrequency: p === "" ? "weekly" : p === "/experts" ? "daily" : "monthly",
    priority: p === "" ? 1 : p === "/experts" ? 0.9 : 0.7,
  }));
}
