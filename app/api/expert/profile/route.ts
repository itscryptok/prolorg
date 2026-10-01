import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { inbox, raw } from "@/lib/inbox";
import { AVAILABILITY_OPTIONS } from "@/lib/experts";
import { checkUpload, MediaUpsertDelegate } from "@/lib/media";

type FullProfileRow = {
  id: string;
  userId: string | null;
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
  status: string;
  hasPhoto: boolean;
  hasVideo: boolean;
};

// GET /api/expert/profile — the signed-in AI pro's own profile (or null).
export async function GET(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (user.role !== "EXPERT") {
    return NextResponse.json({ error: "Only AI pro accounts have profiles." }, { status: 403 });
  }
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database unavailable." }, { status: 503 });

  const rows = await raw<FullProfileRow>(
    db,
    `SELECT e."id", e."userId", e."slug", e."name", e."headline", e."bio",
            e."specialty", e."skills", e."hourlyRate", e."projectRate",
            e."availability", e."city", e."country", e."languages",
            e."yearsExperience", e."status",
            EXISTS(SELECT 1 FROM "ExpertMedia" m WHERE m."expertId" = e."id" AND m."kind" = 'PHOTO') AS "hasPhoto",
            EXISTS(SELECT 1 FROM "ExpertMedia" m WHERE m."expertId" = e."id" AND m."kind" = 'VIDEO') AS "hasVideo"
     FROM "ExpertProfile" e
     WHERE e."userId" = $1
     LIMIT 1`,
    user.id
  );
  const p = rows[0] ?? null;
  return NextResponse.json({ profile: p });
}

function str(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v : "";
}

function intOrNull(v: string): number | null {
  if (v.trim() === "") return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : NaN;
}

// PATCH /api/expert/profile — the AI pro edits their own profile.
// Multipart form: headline, bio, skills, hourlyRate, projectRate,
// availability, city, country, languages, yearsExperience, photo?, video?
export async function PATCH(req: Request) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (user.role !== "EXPERT") {
    return NextResponse.json({ error: "Only AI pro accounts have profiles." }, { status: 403 });
  }
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database unavailable." }, { status: 503 });

  const profile = await inbox(db).expertProfile.findFirst({ where: { userId: user.id } });
  if (!profile) {
    return NextResponse.json(
      { error: "No profile yet — apply through /join and it will link to your account." },
      { status: 404 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const headline = str(form.get("headline")).trim();
  const bio = str(form.get("bio")).trim();
  const availability = str(form.get("availability")).trim();
  const hourlyRate = intOrNull(str(form.get("hourlyRate")));
  const projectRate = intOrNull(str(form.get("projectRate")));
  const yearsExperience = intOrNull(str(form.get("yearsExperience")));

  if (!headline || headline.length > 140) {
    return NextResponse.json({ error: "Headline is required (140 characters max)." }, { status: 400 });
  }
  if (!bio || bio.length > 4000) {
    return NextResponse.json({ error: "Bio is required (4,000 characters max)." }, { status: 400 });
  }
  if (Number.isNaN(hourlyRate) || (hourlyRate !== null && (hourlyRate < 15 || hourlyRate > 75))) {
    return NextResponse.json({ error: "Hourly rate must be between $15 and $75." }, { status: 400 });
  }
  if (Number.isNaN(projectRate) || (projectRate !== null && (projectRate < 65 || projectRate > 650))) {
    return NextResponse.json({ error: "Project rate must be between $65 and $650." }, { status: 400 });
  }
  if (availability && !(AVAILABILITY_OPTIONS as readonly string[]).includes(availability)) {
    return NextResponse.json({ error: "Choose a valid availability." }, { status: 400 });
  }
  if (Number.isNaN(yearsExperience) || (yearsExperience !== null && (yearsExperience < 0 || yearsExperience > 60))) {
    return NextResponse.json({ error: "Years of experience must be 0–60." }, { status: 400 });
  }

  const skills = str(form.get("skills"))
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
  const languages = str(form.get("languages"))
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);

  const photo = await checkUpload(
    form.get("photo") instanceof File ? (form.get("photo") as File) : null,
    "photo"
  );
  const video = await checkUpload(
    form.get("video") instanceof File ? (form.get("video") as File) : null,
    "video"
  );
  if (!photo.ok && photo.error) return NextResponse.json({ error: photo.error }, { status: 400 });
  if (!video.ok && video.error) return NextResponse.json({ error: video.error }, { status: 400 });

  await inbox(db).expertProfile.update({
    where: { id: profile.id },
    data: {
      headline: headline.slice(0, 140),
      bio: bio.slice(0, 4000),
      skills,
      hourlyRate,
      projectRate,
      availability: availability || null,
      city: str(form.get("city")).trim().slice(0, 80) || null,
      country: str(form.get("country")).trim().slice(0, 80) || null,
      languages,
      yearsExperience,
    },
  });

  const delegate = (db as unknown as { expertMedia: MediaUpsertDelegate }).expertMedia;
  const uploads: { kind: string; file: File }[] = [];
  if (photo.ok) uploads.push({ kind: "PHOTO", file: photo.file });
  if (video.ok) uploads.push({ kind: "VIDEO", file: video.file });
  for (const { kind, file } of uploads) {
    const data = Buffer.from(await file.arrayBuffer());
    await delegate.upsert({
      where: { expertId_kind: { expertId: profile.id, kind } },
      update: { mime: file.type, data },
      create: { expertId: profile.id, kind, mime: file.type, data },
    });
  }

  return NextResponse.json({ ok: true });
}
