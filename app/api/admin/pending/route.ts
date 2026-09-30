import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin";

type PendingRow = {
  id: string;
  slug: string;
  name: string;
  headline: string;
  bio: string;
  specialty: string;
  skills: string[];
  hourlyRate: number | null;
  projectRate: number | null;
  availability: string | null;
  city: string | null;
  country: string | null;
  languages: string[];
  yearsExperience: number | null;
  createdAt: string;
  hasPhoto: boolean;
  hasVideo: boolean;
};

// Lists PENDING AI pro profiles for admin review. Admin only.
export async function GET(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  }

  // Casts: local Prisma client is stale; production regenerates it.
  const rows = (await db.expertProfile.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
  } as never)) as unknown as Record<string, unknown>[];

  const media = (await (
    db as unknown as {
      expertMedia: {
        findMany(args: unknown): Promise<{ expertId: string; kind: string }[]>;
      };
    }
  ).expertMedia.findMany({ select: { expertId: true, kind: true } }));
  const byExpert = new Map<string, Set<string>>();
  for (const m of media) {
    const set = byExpert.get(m.expertId) ?? new Set<string>();
    set.add(m.kind);
    byExpert.set(m.expertId, set);
  }

  const pending: PendingRow[] = rows.map((r) => {
    const id = String(r.id ?? "");
    const kinds = byExpert.get(id);
    return {
      id,
      slug: String(r.slug ?? ""),
      name: String(r.name ?? ""),
      headline: String(r.headline ?? ""),
      bio: String(r.bio ?? ""),
      specialty: String(r.specialty ?? ""),
      skills: Array.isArray(r.skills) ? (r.skills as string[]) : [],
      hourlyRate: typeof r.hourlyRate === "number" ? r.hourlyRate : null,
      projectRate: typeof r.projectRate === "number" ? r.projectRate : null,
      availability: typeof r.availability === "string" ? r.availability : null,
      city: typeof r.city === "string" ? r.city : null,
      country: typeof r.country === "string" ? r.country : null,
      languages: Array.isArray(r.languages) ? (r.languages as string[]) : [],
      yearsExperience: typeof r.yearsExperience === "number" ? r.yearsExperience : null,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt ?? ""),
      hasPhoto: kinds?.has("PHOTO") ?? false,
      hasVideo: kinds?.has("VIDEO") ?? false,
    };
  });

  return NextResponse.json({ pending });
}
