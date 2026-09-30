import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import type { Prisma } from "@prisma/client";
import { getDb } from "@/lib/db";
import FilterBar from "@/components/FilterBar";
import ExpertCard from "@/components/ExpertCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Find AI Experts",
  description:
    "Browse Prolorg's directory of vetted AI experts — forensic analysis, genealogy trace, lab discovery, market advantage, personal AI tutoring, technical project development, and data collection & analysis. Filter by specialty, rate, and availability, then hire through the platform inbox.",
  alternates: { canonical: "/experts" },
};

type Params = { [k: string]: string | string[] | undefined };

function first(v: string | string[] | undefined): string {
  return Array.isArray(v) ? v[0] ?? "" : v ?? "";
}

export default async function ExpertsPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const sp = await searchParams;
  const q = first(sp.q).trim();
  const specialty = first(sp.specialty);
  const maxRate = parseInt(first(sp.maxRate), 10);
  const availability = first(sp.availability);
  const sort = first(sp.sort);

  const db = getDb();
  const and: Prisma.ExpertProfileWhereInput[] = [{ status: "APPROVED" }];
  if (specialty) and.push({ specialty });
  if (availability) and.push({ availability });
  if (Number.isFinite(maxRate)) {
    and.push({ OR: [{ hourlyRate: { lte: maxRate } }, { hourlyRate: null }] });
  }
  if (q) {
    and.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { headline: { contains: q, mode: "insensitive" } },
        { bio: { contains: q, mode: "insensitive" } },
        { skills: { hasSome: [q] } },
      ],
    });
  }
  const where: Prisma.ExpertProfileWhereInput = { AND: and };

  const orderBy: Prisma.ExpertProfileOrderByWithRelationInput[] =
    sort === "rating"
      ? [{ ratingAvg: "desc" }]
      : sort === "rate-asc"
        ? [{ hourlyRate: "asc" }]
        : sort === "rate-desc"
          ? [{ hourlyRate: "desc" }]
          : sort === "newest"
            ? [{ createdAt: "desc" }]
            : [{ ratingAvg: "desc" }, { reviewCount: "desc" }];

  const experts = db
    ? await db.expertProfile.findMany({ where, orderBy, take: 60 })
    : [];

  return (
    <div className="container">
      <div className="page-head">
        <p className="eyebrow">Expert directory</p>
        <h1>Find your AI expert</h1>
        <p className="section-lead" style={{ marginBottom: 0 }}>
          Don&rsquo;t hire the AI. It burns your time and your token. Browse
          vetted experts by specialty, compare rates and availability, and hire
          through the Prolorg inbox — no bidding, no exposed emails.
        </p>
      </div>

      <Suspense>
        <FilterBar total={experts.length} />
      </Suspense>

      {experts.length === 0 ? (
        <div className="empty-state">
          <h2>No experts match those filters</h2>
          <p>
            {db
              ? "Try widening the rate range, clearing the keyword, or choosing a different specialty."
              : "The directory database is still connecting. Check back shortly — or be the first expert on it."}
          </p>
          <div className="hero-ctas">
            <Link href="/experts" className="btn btn-outline">Clear filters</Link>
            <Link href="/join" className="btn btn-orange">Join as an expert</Link>
          </div>
        </div>
      ) : (
        <div className="expert-grid">
          {experts.map((e) => (
            <ExpertCard key={e.id} expert={e} />
          ))}
        </div>
      )}

      <div className="directory-cta">
        <h2>Are you an AI expert?</h2>
        <p>Create your Prolorg profile and get hired through the inbox — no bidding wars, no proposal spam.</p>
        <Link href="/join" className="btn btn-orange">Join as an expert</Link>
      </div>
    </div>
  );
}
