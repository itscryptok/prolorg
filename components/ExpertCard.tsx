import Link from "next/link";
import { avatarHue, formatRate, initials } from "@/lib/experts";
import FlagButton from "./FlagButton";

export type ExpertCardData = {
  id: string;
  slug: string;
  name: string;
  headline: string;
  specialty: string;
  skills: string[];
  hourlyRate: number | null;
  projectRate: number | null;
  availability: string | null;
  city: string | null;
  country: string | null;
  ratingAvg: number;
  reviewCount: number;
  completedJobs: number;
};

export function ExpertAvatar({ name, size = 64 }: { name: string; size?: number }) {
  const hue = avatarHue(name);
  return (
    <span
      className="expert-avatar"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `linear-gradient(135deg, hsl(${hue} 65% 45%), hsl(${(hue + 40) % 360} 65% 35%))`,
      }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

export function RatingStars({ rating, count }: { rating: number; count: number }) {
  if (count === 0) return <span className="rating-new">New AI pro</span>;
  const full = Math.round(rating);
  return (
    <span className="rating" aria-label={`Rated ${rating.toFixed(1)} out of 5 from ${count} reviews`}>
      <span aria-hidden="true">{"★".repeat(full)}{"☆".repeat(5 - full)}</span>
      <span className="rating-num">{rating.toFixed(1)} ({count})</span>
    </span>
  );
}

// AI pro directory card: avatar, name, specialty, headline, rating, rate,
// availability, and a link that opens the AI pro's video in the watch feed.
export default function ExpertCard({ expert }: { expert: ExpertCardData }) {
  const location = [expert.city, expert.country].filter(Boolean).join(", ");
  const watchHref = `/watch?expert=${expert.slug}`;
  return (
    <article className="expert-card">
      <div className="expert-card-top">
        <ExpertAvatar name={expert.name} />
        <div className="expert-card-id">
          <h3>
            <Link href={watchHref}>{expert.name}</Link>
          </h3>
          <span className="pill">{expert.specialty}</span>
        </div>
      </div>
      <p className="expert-headline">{expert.headline}</p>
      <div className="expert-meta">
        <RatingStars rating={expert.ratingAvg} count={expert.reviewCount} />
        <span className="expert-rate">{formatRate(expert.hourlyRate, expert.projectRate)}</span>
      </div>
      <div className="expert-sub">
        {expert.availability && <span className="avail">{expert.availability}</span>}
        {location && <span className="loc">{location}</span>}
        {expert.completedJobs > 0 && <span>{expert.completedJobs} jobs done</span>}
      </div>
      <div className="expert-card-foot">
        <Link href={watchHref} className="btn btn-outline expert-cta">
          Watch intro
        </Link>
        <FlagButton expertId={expert.id} expertName={expert.name} />
      </div>
    </article>
  );
}
