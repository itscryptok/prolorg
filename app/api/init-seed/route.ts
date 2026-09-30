import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

/**
 * ONE-TIME setup endpoint: seeds the 8 sample expert profiles.
 * Protected by INIT_TOKEN; removed after use.
 *
 * POST /api/init-seed  { "token": "..." }
 *
 * Requires DATABASE_URL to point at the `prolorg` database (set in the
 * dashboard before calling). Idempotent: skips experts whose slug exists.
 */

type SeedExpert = {
  slug: string;
  name: string;
  headline: string;
  bio: string;
  specialty: string;
  skills: string[];
  languages: string[];
  hourlyRate: number | null;
  projectRate: number | null;
  availability: string;
  city: string | null;
  country: string;
  yearsExperience: number | null;
  ratingAvg: number;
  reviews: number;
  jobs: number;
};

const EXPERTS: SeedExpert[] = [
  {
    slug: "marcus-reid",
    name: "Marcus Reid",
    headline: "Digital forensics investigator — fraud, breach & evidence analysis",
    bio: "I help legal teams, insurers, and founders get court-ready answers from messy digital evidence. Fifteen years in corporate investigations and incident response, from Fortune 500 breach triage to expert-witness support.\n\nMy AI-assisted forensics workflow cuts document review time dramatically while keeping a strict chain of custody, so findings hold up under scrutiny.",
    specialty: "Forensic analysis",
    skills: ["Digital forensics", "Incident response", "Fraud investigation", "Chain of custody", "eDiscovery", "Expert witness support"],
    languages: ["English"],
    hourlyRate: 180,
    projectRate: 4500,
    availability: "Available now",
    city: "Dallas",
    country: "United States",
    yearsExperience: 15,
    ratingAvg: 4.9,
    reviews: 34,
    jobs: 61,
  },
  {
    slug: "elena-vasquez",
    name: "Elena Vasquez",
    headline: "Genealogist tracing family lines with DNA + AI record matching",
    bio: "I reconstruct family histories that paper trails alone can't finish. Certified genealogist combining archival research across US, Mexican, and Spanish records with DNA triangulation and AI-assisted handwriting transcription.\n\nWhether you're verifying lineage, finding biological family, or building a legacy book, I deliver sourced, cited family trees — not guesses.",
    specialty: "Genealogy trace",
    skills: ["Archival research", "DNA triangulation", "Census & parish records", "Handwriting transcription", "Family tree building", "Heir research"],
    languages: ["English", "Spanish"],
    hourlyRate: 85,
    projectRate: 1200,
    availability: "Available now",
    city: "San Antonio",
    country: "United States",
    yearsExperience: 11,
    ratingAvg: 5.0,
    reviews: 58,
    jobs: 93,
  },
  {
    slug: "priya-nair",
    name: "Dr. Priya Nair",
    headline: "PhD scientist — AI-accelerated literature review & lab discovery",
    bio: "I turn overwhelming scientific literature into decision-ready insight. PhD in molecular biology with a track record across biotech R&D, systematic reviews, and grant-backed discovery programs.\n\nI build AI-assisted review pipelines that screen thousands of papers, extract structured findings, and flag reproducibility risks — so your lab or fund moves on evidence, not hype.",
    specialty: "Lab discovery",
    skills: ["Systematic reviews", "Bioinformatics", "Protocol design", "Data extraction", "Reproducibility audits", "Grant writing"],
    languages: ["English"],
    hourlyRate: 150,
    projectRate: 6000,
    availability: "Booking 2 weeks out",
    city: "Boston",
    country: "United States",
    yearsExperience: 12,
    ratingAvg: 4.8,
    reviews: 27,
    jobs: 44,
  },
  {
    slug: "jordan-blake",
    name: "Jordan Blake",
    headline: "Market researcher giving startups an unfair information advantage",
    bio: "I find the signal your competitors miss. Former hedge-fund analyst now running AI-driven market intelligence: sizing, competitor teardowns, pricing studies, and trend detection across public and alternative data.\n\nEngagements end with a ranked opportunity map and the raw evidence behind it — built for founders who need to move fast without guessing.",
    specialty: "Market advantage",
    skills: ["Competitive intelligence", "Market sizing", "Pricing research", "Trend analysis", "Survey design", "Alternative data"],
    languages: ["English"],
    hourlyRate: 140,
    projectRate: 3800,
    availability: "Available now",
    city: "Austin",
    country: "United States",
    yearsExperience: 9,
    ratingAvg: 4.9,
    reviews: 41,
    jobs: 77,
  },
  {
    slug: "sofia-lindqvist",
    name: "Sofia Lindqvist",
    headline: "Personal AI tutor — from first prompt to workplace fluency",
    bio: "I teach busy professionals to actually use AI, not just admire it. Former university lecturer with a coaching practice built around 1:1 tutoring: prompt craft, workflow automation, and safe, effective daily use.\n\nSessions are hands-on and jargon-free, with practice plans between meetings. Most clients run their first automated workflow within two weeks.",
    specialty: "Personal AI tutor",
    skills: ["Prompt engineering", "Workflow automation", "AI literacy", "1:1 coaching", "Curriculum design", "Tool selection"],
    languages: ["English", "Swedish"],
    hourlyRate: 95,
    projectRate: 750,
    availability: "Available now",
    city: "Remote",
    country: "Sweden",
    yearsExperience: 8,
    ratingAvg: 5.0,
    reviews: 73,
    jobs: 120,
  },
  {
    slug: "david-okafor",
    name: "David Okafor",
    headline: "Technical project developer — AI features shipped, not demoed",
    bio: "I lead AI builds from fuzzy idea to production system. Engineering manager turned independent developer: scoping, architecture, model selection, evaluation, and the unglamorous deployment work that makes AI reliable.\n\nI work in weekly milestones with demo-able progress, and I document everything so your team can own it after handoff.",
    specialty: "Technical project developer",
    skills: ["Solution architecture", "LLM integration", "RAG systems", "Evaluation harnesses", "MLOps", "Team leadership"],
    languages: ["English"],
    hourlyRate: 165,
    projectRate: 9000,
    availability: "Booking 1 month out",
    city: "Lagos",
    country: "Nigeria",
    yearsExperience: 13,
    ratingAvg: 4.9,
    reviews: 39,
    jobs: 52,
  },
  {
    slug: "amara-diallo",
    name: "Amara Diallo",
    headline: "Data collector & analyst — clean datasets, honest dashboards",
    bio: "I build the data foundations AI projects actually need. Specialist in large-scale collection, labeling pipelines, quality audits, and analysis that non-technical teams can act on.\n\nEvery dataset ships with a quality report: coverage, bias checks, and known gaps documented up front — so nothing surprises you downstream.",
    specialty: "Data collector & analyst",
    skills: ["Data collection", "Annotation pipelines", "Quality audits", "SQL & Python", "Dashboards", "Bias assessment"],
    languages: ["English", "French"],
    hourlyRate: 75,
    projectRate: 2000,
    availability: "Available now",
    city: "Dakar",
    country: "Senegal",
    yearsExperience: 7,
    ratingAvg: 4.8,
    reviews: 46,
    jobs: 88,
  },
  {
    slug: "kenji-tanaka",
    name: "Kenji Tanaka",
    headline: "AI generalist for everything that doesn't fit a box",
    bio: "My work lives between the specialties: AI voice agents, custom GPT builds, creative automation, unusual integrations. If your project is hard to categorize, it's probably mine.\n\nI prototype fast — most ideas get a working demo within days — then harden what works into something you can depend on.",
    specialty: "Other AI work",
    skills: ["Voice agents", "Custom GPTs", "Creative automation", "API integrations", "Rapid prototyping", "No-code/low-code"],
    languages: ["English", "Japanese"],
    hourlyRate: 110,
    projectRate: 2500,
    availability: "Limited availability",
    city: "Remote",
    country: "Japan",
    yearsExperience: 10,
    ratingAvg: 4.9,
    reviews: 52,
    jobs: 96,
  },
];

export async function POST(req: NextRequest) {
  const expected = process.env.INIT_TOKEN;
  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  if (!expected || body.token !== expected) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const db = new PrismaClient();
  try {
    const results: Array<{ slug: string; status: string }> = [];
    for (const e of EXPERTS) {
      const existing = await db.expertProfile.findUnique({
        where: { slug: e.slug },
        select: { id: true },
      });
      if (existing) {
        results.push({ slug: e.slug, status: "exists" });
        continue;
      }
      await db.expertProfile.create({
        data: {
          slug: e.slug,
          name: e.name,
          headline: e.headline,
          bio: e.bio,
          specialty: e.specialty,
          skills: e.skills,
          languages: e.languages,
          hourlyRate: e.hourlyRate,
          projectRate: e.projectRate,
          availability: e.availability,
          city: e.city,
          country: e.country,
          yearsExperience: e.yearsExperience,
          ratingAvg: e.ratingAvg,
          reviewCount: e.reviews,
          completedJobs: e.jobs,
          status: "APPROVED",
          isSample: true,
        },
      });
      results.push({ slug: e.slug, status: "created" });
    }
    return NextResponse.json({ ok: true, results });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}
