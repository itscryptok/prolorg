import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import WatchFeed, { type WatchExpert } from "@/components/WatchFeed";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Watch AI pro Intros",
  description:
    "Swipe through Prolorg AI pro video intros — forensic analysis, genealogy trace, lab discovery, market advantage, personal AI tutoring, technical project development, and data collection & analysis. Like an AI pro or open their full profile.",
  alternates: { canonical: "/watch" },
};

type Params = { [k: string]: string | string[] | undefined };

// Full-screen swipeable AI pro viewer. Data is mapped through a local
// interface so the page is insulated from generated-client drift.
export default async function WatchPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const sp = await searchParams;
  const raw = sp.expert;
  const startSlug = Array.isArray(raw) ? raw[0] ?? null : raw ?? null;

  const db = getDb();
  // Cast: the local generated client is stale (production regenerates it at
  // build time); the query is valid against the real schema.
  const rows = db
    ? await db.expertProfile.findMany({
        where: { status: "APPROVED" },
        orderBy: [{ ratingAvg: "desc" }, { reviewCount: "desc" }],
        take: 60,
      } as never)
    : [];

  // Which AI pros have uploaded photo/video (media bytes stay out of the
  // list query; they are streamed per-AI pro by the media route).
  const mediaRows: { expertId: string; kind: string }[] = db
    ? await (
        db as unknown as {
          expertMedia: {
            findMany(args: unknown): Promise<{ expertId: string; kind: string }[]>;
          };
        }
      ).expertMedia.findMany({ select: { expertId: true, kind: true } })
    : [];
  const mediaByExpert = new Map<string, Set<string>>();
  for (const m of mediaRows) {
    const set = mediaByExpert.get(m.expertId) ?? new Set<string>();
    set.add(m.kind);
    mediaByExpert.set(m.expertId, set);
  }

  const experts: WatchExpert[] = (rows as unknown as Record<string, unknown>[]).map((r) => ({
    id: String(r.id ?? ""),
    slug: String(r.slug ?? ""),
    name: String(r.name ?? "Prolorg AI pro"),
    headline: String(r.headline ?? ""),
    specialty: String(r.specialty ?? (Array.isArray(r.specialties) ? r.specialties[0] : "") ?? ""),
    skills: Array.isArray(r.skills) ? (r.skills as string[]) : [],
    photoUrl: typeof r.photoUrl === "string" ? r.photoUrl : null,
    hasPhoto: mediaByExpert.get(String(r.id))?.has("PHOTO") ?? false,
    hasVideo: mediaByExpert.get(String(r.id))?.has("VIDEO") ?? false,
    hourlyRate: typeof r.hourlyRate === "number" ? r.hourlyRate : null,
    projectRate: typeof r.projectRate === "number" ? r.projectRate : null,
    availability: typeof r.availability === "string" ? r.availability : null,
    city: typeof r.city === "string" ? r.city : null,
    country: typeof r.country === "string" ? r.country : null,
    ratingAvg: typeof r.ratingAvg === "number" ? r.ratingAvg : 0,
    reviewCount: typeof r.reviewCount === "number" ? r.reviewCount : 0,
    likesCount: typeof r.likesCount === "number" ? r.likesCount : 0,
  })).filter((e) => e.slug);

  return (
    <div className="container">
      <WatchFeed experts={experts} startSlug={startSlug} />
    </div>
  );
}
