import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { SPECIALTIES, AVAILABILITY_OPTIONS, slugify } from "@/lib/experts";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_VIDEO_BYTES = 25 * 1024 * 1024; // 25 MB

function str(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v : "";
}

function num(v: string): number | null {
  if (v.trim() === "") return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function list(v: string): string[] {
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
}

// Narrow typed access to the ExpertMedia delegate (local generated Prisma
// client is stale; production regenerates it at build time).
type MediaDelegate = {
  upsert(args: {
    where: { expertId_kind: { expertId: string; kind: string } };
    update: { mime: string; data: Buffer };
    create: { expertId: string; kind: string; mime: string; data: Buffer };
  }): Promise<unknown>;
};

function checkFile(
  file: File | null,
  kind: "photo" | "video"
): { ok: true; file: File } | { ok: false; error: string } {
  if (!file || file.size === 0) return { ok: false, error: "" }; // not provided
  const max = kind === "photo" ? MAX_PHOTO_BYTES : MAX_VIDEO_BYTES;
  const prefix = kind === "photo" ? "image/" : "video/";
  if (!file.type.startsWith(prefix)) {
    return { ok: false, error: `The ${kind} must be a ${kind === "photo" ? "image" : "video"} file.` };
  }
  if (file.size > max) {
    const mb = Math.round(max / 1024 / 1024);
    return { ok: false, error: `The ${kind} is too large — keep it under ${mb} MB.` };
  }
  return { ok: true, file };
}

// Creates a PENDING expert profile with optional photo + intro video uploads.
// Accepts multipart/form-data. No website/email fields are accepted — contact
// lockdown is enforced by simply not collecting them.
export async function POST(req: Request) {
  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { error: "The directory database is still connecting. Please try again shortly." },
      { status: 503 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = str(form.get("name")).trim();
  const headline = str(form.get("headline")).trim();
  const bio = str(form.get("bio")).trim();
  const specialty = str(form.get("specialty")).trim();
  const availability = str(form.get("availability")).trim();

  if (!name || !headline || !bio) {
    return NextResponse.json(
      { error: "Name, headline, and bio are required." },
      { status: 400 }
    );
  }
  if (!(SPECIALTIES as readonly string[]).includes(specialty)) {
    return NextResponse.json({ error: "Choose a valid specialty." }, { status: 400 });
  }
  if (availability && !(AVAILABILITY_OPTIONS as readonly string[]).includes(availability)) {
    return NextResponse.json({ error: "Choose a valid availability." }, { status: 400 });
  }

  const photoEntry = form.get("photo");
  const videoEntry = form.get("video");
  const photo = checkFile(photoEntry instanceof File ? photoEntry : null, "photo");
  const video = checkFile(videoEntry instanceof File ? videoEntry : null, "video");
  if (!photo.ok && photo.error) return NextResponse.json({ error: photo.error }, { status: 400 });
  if (!video.ok && video.error) return NextResponse.json({ error: video.error }, { status: 400 });

  const base = slugify(name) || "expert";
  let slug = base;
  for (let i = 2; ; i++) {
    const taken = await db.expertProfile.findUnique({ where: { slug } });
    if (!taken) break;
    slug = `${base}-${i}`;
  }

  const profile = await db.expertProfile.create({
    data: {
      slug,
      name: name.slice(0, 80),
      headline: headline.slice(0, 140),
      bio: bio.slice(0, 4000),
      specialty,
      skills: list(str(form.get("skills"))),
      hourlyRate: num(str(form.get("hourlyRate"))),
      projectRate: num(str(form.get("projectRate"))),
      availability: availability || null,
      city: str(form.get("city")).trim().slice(0, 80) || null,
      country: str(form.get("country")).trim().slice(0, 80) || null,
      languages: list(str(form.get("languages"))),
      yearsExperience: num(str(form.get("yearsExperience"))),
      status: "PENDING",
    },
    select: { id: true },
  });

  const delegate = (db as unknown as { expertMedia: MediaDelegate }).expertMedia;
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

  return NextResponse.json({ slug }, { status: 201 });
}
