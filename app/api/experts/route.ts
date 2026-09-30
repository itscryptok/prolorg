import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { SPECIALTIES, AVAILABILITY_OPTIONS, slugify } from "@/lib/experts";

type Body = {
  name?: string;
  headline?: string;
  bio?: string;
  specialty?: string;
  skills?: string;
  hourlyRate?: string;
  projectRate?: string;
  availability?: string;
  city?: string;
  country?: string;
  languages?: string;
  yearsExperience?: string;
};

function num(v: string | undefined): number | null {
  if (v == null || v.trim() === "") return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function list(v: string | undefined): string[] {
  return (v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
}

// Creates a PENDING expert profile. No website/email fields are accepted —
// contact lockdown is enforced by simply not collecting them.
export async function POST(req: Request) {
  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { error: "The directory database is still connecting. Please try again shortly." },
      { status: 503 }
    );
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const headline = (body.headline ?? "").trim();
  const bio = (body.bio ?? "").trim();
  const specialty = (body.specialty ?? "").trim();

  if (!name || !headline || !bio) {
    return NextResponse.json(
      { error: "Name, headline, and bio are required." },
      { status: 400 }
    );
  }
  if (!(SPECIALTIES as readonly string[]).includes(specialty)) {
    return NextResponse.json({ error: "Choose a valid specialty." }, { status: 400 });
  }
  if (body.availability && !(AVAILABILITY_OPTIONS as readonly string[]).includes(body.availability)) {
    return NextResponse.json({ error: "Choose a valid availability." }, { status: 400 });
  }

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
      skills: list(body.skills),
      hourlyRate: num(body.hourlyRate),
      projectRate: num(body.projectRate),
      availability: body.availability?.trim() || null,
      city: body.city?.trim().slice(0, 80) || null,
      country: body.country?.trim().slice(0, 80) || null,
      languages: list(body.languages),
      yearsExperience: num(body.yearsExperience),
      status: "PENDING",
    },
    select: { slug: true },
  });

  return NextResponse.json({ slug: profile.slug }, { status: 201 });
}
