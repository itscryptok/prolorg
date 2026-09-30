import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { formatRate } from "@/lib/experts";
import { ExpertAvatar, RatingStars } from "@/components/ExpertCard";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const db = getDb();
  const expert = db
    ? await db.expertProfile.findFirst({ where: { slug, status: "APPROVED" } })
    : null;
  if (!expert) return { title: "Expert not found" };
  return {
    title: `${expert.name} — ${expert.specialty} expert`,
    description: `${expert.headline} Hire ${expert.name}, a Prolorg ${expert.specialty} expert, through the platform inbox. ${formatRate(expert.hourlyRate, expert.projectRate)}.`,
    alternates: { canonical: `/experts/${expert.slug}` },
  };
}

export default async function ExpertProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const db = getDb();
  const expert = db
    ? await db.expertProfile.findFirst({ where: { slug, status: "APPROVED" } })
    : null;
  if (!expert) notFound();

  const location = [expert.city, expert.country].filter(Boolean).join(", ");

  // Uploaded media flags (delegate cast: local Prisma client is stale;
  // production regenerates it at build time).
  const mediaKinds: string[] = db
    ? (
        await (
          db as unknown as {
            expertMedia: {
              findMany(args: unknown): Promise<{ kind: string }[]>;
            };
          }
        ).expertMedia.findMany({
          where: { expertId: expert.id },
          select: { kind: true },
        })
      ).map((m) => m.kind)
    : [];
  const hasVideo = mediaKinds.includes("VIDEO");
  const uploadedPhotoUrl = mediaKinds.includes("PHOTO")
    ? `/api/experts/media/${expert.id}/photo`
    : null;
  const legacyPhotoUrl = (expert as unknown as { photoUrl?: string | null }).photoUrl ?? null;
  const photoSrc = uploadedPhotoUrl ?? legacyPhotoUrl;

  // In-progress hires: hire requests agreed/confirmed but not yet completed.
  // (Raw SQL: local Prisma client is stale; production regenerates it.)
  const inProgressJobs: number = db
    ? Number(
        (
          await (
            db as unknown as {
              $queryRawUnsafe(query: string, ...params: unknown[]): Promise<{ count: number }[]>;
            }
          ).$queryRawUnsafe(
            `SELECT COUNT(*)::int AS count FROM "HireRequest" h
             JOIN "Conversation" c ON c."id" = h."conversationId"
             JOIN "User" u ON u."id" = c."expertId"
             JOIN "ExpertProfile" e ON e."userId" = u."id"
             WHERE e."id" = $1 AND h."status" IN ('AGREED', 'CONFIRMED')`,
            expert.id
          )
        )[0]?.count ?? 0
      )
    : 0;

  return (
    <div className="container">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/experts">Experts</Link>
        <span aria-hidden="true"> / </span>
        <span>{expert.name}</span>
      </nav>

      <div className="profile-grid">
        <div className="profile-main">
          <header className="profile-head">
            {photoSrc ? (
              <img src={photoSrc} alt={`${expert.name}`} className="profile-photo" />
            ) : (
              <ExpertAvatar name={expert.name} size={96} />
            )}
            <div>
              <span className="pill">{expert.specialty}</span>
              <h1>{expert.name}</h1>
              <p className="profile-headline">{expert.headline}</p>
              <div className="profile-facts">
                <RatingStars rating={expert.ratingAvg} count={expert.reviewCount} />
                {location && <span>{location}</span>}
                {expert.languages.length > 0 && (
                  <span>Speaks {expert.languages.join(", ")}</span>
                )}
              </div>
            </div>
          </header>

          {hasVideo && (
            <section aria-labelledby="intro-video">
              <h2 id="intro-video">Intro video</h2>
              <video
                className="profile-video"
                src={`/api/experts/media/${expert.id}/video`}
                poster={photoSrc ?? undefined}
                controls
                playsInline
                preload="metadata"
              />
            </section>
          )}

          <section aria-labelledby="about">
            <h2 id="about">About</h2>
            {expert.bio.split(/\n\n+/).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </section>

          {expert.skills.length > 0 && (
            <section aria-labelledby="skills">
              <h2 id="skills">Skills</h2>
              <ul className="skill-chips">
                {expert.skills.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="reviews">
            <h2 id="reviews">Reviews</h2>
            <div className="empty-state" style={{ padding: "2rem 1.25rem" }}>
              <p style={{ margin: 0 }}>
                No reviews yet — client reviews appear here after this
                expert&rsquo;s first completed hires.
              </p>
            </div>
          </section>
        </div>

        <aside className="profile-side" aria-label="Hire this expert">
          <div className="rate-card">
            <p className="rate-big">{formatRate(expert.hourlyRate, expert.projectRate)}</p>
            {expert.availability && (
              <p className="avail"><strong>Availability:</strong> {expert.availability}</p>
            )}
            <dl className="stat-list">
              {expert.yearsExperience != null && (
                <>
                  <dt>Experience</dt>
                  <dd>{expert.yearsExperience} yrs</dd>
                </>
              )}
              <dt>Jobs completed</dt>
              <dd>{expert.completedJobs}</dd>
              <dt>In progress</dt>
              <dd>{inProgressJobs}</dd>
            </dl>
            <Link href="/signup" className="btn btn-orange profile-cta">
              Message expert
            </Link>
            <p className="fine-print">
              Free client accounts open soon — messaging and hiring unlock with
              Prolorg accounts in the next release.
            </p>
          </div>
          <div className="notice" style={{ marginTop: "1rem" }}>
            <strong>Stays on Prolorg.</strong> Experts never share website
            links or email addresses here — every conversation and hire happens
            inside the platform inbox.
          </div>
        </aside>
      </div>
    </div>
  );
}
