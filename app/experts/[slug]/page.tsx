import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { formatRate } from "@/lib/experts";
import { ExpertAvatar, RatingStars } from "@/components/ExpertCard";
import MessageExpertButton from "@/components/MessageExpertButton";

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
  if (!expert) return { title: "AI pro not found" };
  return {
    title: `${expert.name} — ${expert.specialty} AI pro`,
    description: `${expert.headline} Hire ${expert.name}, an AiProlice ${expert.specialty} AI pro, through the platform inbox. ${formatRate(expert.hourlyRate, expert.projectRate)}.`,
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

  // Sample work entries (newest first by sort order).
  const samples: { id: string; title: string; description: string; hasImage: boolean }[] = db
    ? (
        await (
          db as unknown as {
            expertSample: {
              findMany(args: unknown): Promise<
                { id: string; title: string; description: string; image: Buffer | null }[]
              >;
            };
          }
        ).expertSample.findMany({
          where: { expertId: expert.id },
          orderBy: { sortOrder: "asc" },
          select: { id: true, title: true, description: true, image: true },
        })
      ).map((s) => ({ id: s.id, title: s.title, description: s.description, hasImage: !!s.image }))
    : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    dateCreated: expert.createdAt?.toISOString?.() ?? undefined,
    mainEntity: {
      "@type": "Person",
      name: expert.name,
      description: expert.bio,
      jobTitle: expert.headline,
      knowsAbout: expert.skills,
      ...(location ? { address: location } : {}),
      ...(photoSrc ? { image: photoSrc } : {}),
      ...(expert.reviewCount > 0
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: expert.ratingAvg,
              reviewCount: expert.reviewCount,
            },
          }
        : {}),
    },
  };

  // Reviews from completed hires, newest first.
  // (Raw SQL: local Prisma client is stale; production regenerates it.)
  const reviews: { id: string; rating: number; comment: string | null; createdAt: string }[] = db
    ? (
        await (
          db as unknown as {
            $queryRawUnsafe(query: string, ...params: unknown[]): Promise<
              { id: string; rating: number; comment: string | null; createdAt: Date }[]
            >;
          }
        ).$queryRawUnsafe(
          `SELECT r."id", r."rating", r."comment", r."createdAt"
           FROM "Review" r
           JOIN "HireRequest" h ON h."id" = r."hireRequestId"
           JOIN "Conversation" c ON c."id" = h."conversationId"
           JOIN "ExpertProfile" e ON e."userId" = c."expertId"
           WHERE e."id" = $1 AND h."status" = 'COMPLETED'
           ORDER BY r."createdAt" DESC`,
          expert.id
        )
      ).map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
      }))
    : [];

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/experts">AI pros</Link>
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

          {samples.length > 0 && (
            <section aria-labelledby="sample-work">
              <h2 id="sample-work">Sample work</h2>
              <div className="sample-grid">
                {samples.map((s) => (
                  <article key={s.id} className="sample-card">
                    {s.hasImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/experts/samples/${s.id}/image`}
                        alt={`Sample work: ${s.title}`}
                        className="sample-image"
                        loading="lazy"
                      />
                    )}
                    <h3>{s.title}</h3>
                    <p>{s.description}</p>
                  </article>
                ))}
              </div>
            </section>
          )}

          <section aria-labelledby="reviews">
            <h2 id="reviews">Reviews</h2>
            {reviews.length > 0 ? (
              <ul className="review-list">
                {reviews.map((r) => (
                  <li key={r.id} className="review-card">
                    <span className="rating" aria-label={`Rated ${r.rating} out of 5`}>
                      <span aria-hidden="true">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                    </span>
                    {r.comment && <p>{r.comment}</p>}
                    <span className="review-date">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-state" style={{ padding: "2rem 1.25rem" }}>
                <p style={{ margin: 0 }}>
                  No reviews yet — client reviews appear here after this
                  AI pro&rsquo;s first completed hires.
                </p>
              </div>
            )}
          </section>
        </div>

        <aside className="profile-side" aria-label="Hire this AI pro">
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
            <MessageExpertButton slug={expert.slug} />
            <p className="fine-print">
              Free to message — hiring happens through hire requests in the
              inbox, and direct contact unlocks with a paid one-time fee
              (coming soon).
            </p>
          </div>
          <div className="notice" style={{ marginTop: "1rem" }}>
            <strong>Stays on AiProlice.</strong> AI pros never share website
            links or email addresses here — every conversation and hire happens
            inside the platform inbox.
          </div>
        </aside>
      </div>
    </div>
  );
}
