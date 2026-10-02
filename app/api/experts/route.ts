import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { AVAILABILITY_OPTIONS, slugify } from "@/lib/experts";
import { getSessionUser } from "@/lib/auth";

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

// Magic-byte signatures so a renamed .exe/.html can't pass as media.
function sniffMedia(buf: Uint8Array, kind: "photo" | "video"): boolean {
  const sig = (offset: number, bytes: number[]) =>
    bytes.every((b, i) => buf[offset + i] === b);
  if (kind === "photo") {
    return (
      sig(0, [0xff, 0xd8, 0xff]) || // JPEG
      sig(0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) || // PNG
      sig(0, [0x47, 0x49, 0x46, 0x38]) || // GIF87a/GIF89a
      (sig(0, [0x52, 0x49, 0x46, 0x46]) && sig(8, [0x57, 0x45, 0x42, 0x50])) || // WebP
      (sig(4, [0x66, 0x74, 0x79, 0x70]) && sig(8, [0x61, 0x76, 0x69, 0x66])) || // AVIF
      sig(0, [0x42, 0x4d]) // BMP
    );
  }
  return (
    sig(4, [0x66, 0x74, 0x79, 0x70]) || // MP4 / MOV / 3GP ("....ftyp")
    sig(0, [0x1a, 0x45, 0xdf, 0xa3]) || // WebM / MKV
    (sig(0, [0x52, 0x49, 0x46, 0x46]) && sig(8, [0x41, 0x56, 0x49, 0x20])) // AVI
  );
}

async function checkFile(
  file: File | null,
  kind: "photo" | "video"
): Promise<{ ok: true; file: File } | { ok: false; error: string }> {
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
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!sniffMedia(head, kind)) {
    return {
      ok: false,
      error: `That ${kind} file looks corrupted or isn't a real ${kind === "photo" ? "image" : "video"} — please pick another file.`,
    };
  }
  return { ok: true, file };
}

// Narrow typed access to the ExpertSample delegate (local generated Prisma
// client is stale; production regenerates it at build time).
type SampleDelegate = {
  create(args: {
    data: {
      expertId: string;
      title: string;
      description: string;
      image?: Buffer;
      imageMime?: string;
      sortOrder: number;
    };
  }): Promise<unknown>;
};

const MAX_SAMPLES = 3;

async function checkSampleImage(
  file: File | null
): Promise<{ ok: true; file: File } | { ok: false; error: string } | null> {
  if (!file || file.size === 0) return null; // not provided
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "Sample images must be image files." };
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return { ok: false, error: "Sample images must be under 5 MB." };
  }
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!sniffMedia(head, "photo")) {
    return { ok: false, error: "A sample image looks corrupted or isn't a real image." };
  }
  return { ok: true, file };
}

// Creates an APPROVED AI pro profile with optional photo + intro video uploads.
// Yemi 2026-10-02: no manual approval — new pros go live instantly at scale;
// moderation is via member flags + the admin deactivate control in /addy.
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
  if (!specialty || specialty.length > 80) {
    return NextResponse.json({ error: "Tell us your specialty." }, { status: 400 });
  }
  if (availability && !(AVAILABILITY_OPTIONS as readonly string[]).includes(availability)) {
    return NextResponse.json({ error: "Choose a valid availability." }, { status: 400 });
  }

  const photoEntry = form.get("photo");
  const videoEntry = form.get("video");
  const photo = await checkFile(photoEntry instanceof File ? photoEntry : null, "photo");
  const video = await checkFile(videoEntry instanceof File ? videoEntry : null, "video");
  if (!photo.ok && photo.error) return NextResponse.json({ error: photo.error }, { status: 400 });
  if (!video.ok && video.error) return NextResponse.json({ error: video.error }, { status: 400 });

  const base = slugify(name) || "AI pro";
  let slug = base;
  for (let i = 2; ; i++) {
    const taken = await db.expertProfile.findUnique({ where: { slug } });
    if (!taken) break;
    slug = `${base}-${i}`;
  }

  // Big/MVP: when a signed-in AI pro applies, link the new profile to
  // their account so they own it once approved.
  const sessionUser = await getSessionUser(req);
  const ownerId =
    sessionUser && sessionUser.role === "EXPERT" ? sessionUser.id : null;

  const profile = await db.expertProfile.create({
    data: {
      slug,
      ...(ownerId ? { userId: ownerId } : {}),
      name: name.slice(0, 80),      headline: headline.slice(0, 140),
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
      status: "APPROVED",
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

  // Sample work entries: up to 3, each with title + description + optional
  // image. A sample counts only when it has a title; description is required
  // with a title. No URLs — contact lockdown.
  const sampleDelegate = (db as unknown as { expertSample: SampleDelegate }).expertSample;
  let sortOrder = 0;
  for (let i = 0; i < MAX_SAMPLES; i++) {
    const title = str(form.get(`sample${i}_title`)).trim();
    if (!title) continue;
    const description = str(form.get(`sample${i}_description`)).trim();
    if (!description) {
      return NextResponse.json(
        { error: `Sample work #${i + 1} needs a short description.` },
        { status: 400 }
      );
    }
    const imgEntry = form.get(`sample${i}_image`);
    const img = await checkSampleImage(imgEntry instanceof File ? imgEntry : null);
    if (img && !img.ok) return NextResponse.json({ error: img.error }, { status: 400 });
    const data: {
      expertId: string;
      title: string;
      description: string;
      image?: Buffer;
      imageMime?: string;
      sortOrder: number;
    } = {
      expertId: profile.id,
      title: title.slice(0, 120),
      description: description.slice(0, 2000),
      sortOrder: sortOrder++,
    };
    if (img && img.ok) {
      data.image = Buffer.from(await img.file.arrayBuffer());
      data.imageMime = img.file.type;
    }
    await sampleDelegate.create({ data });
  }

  return NextResponse.json({ slug }, { status: 201 });
}
