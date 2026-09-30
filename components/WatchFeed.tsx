"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { avatarHue, formatRate, initials } from "@/lib/experts";

export interface WatchExpert {
  id: string;
  slug: string;
  name: string;
  headline: string;
  specialty: string;
  skills: string[];
  photoUrl: string | null;
  hasPhoto: boolean;
  hasVideo: boolean;
  hourlyRate: number | null;
  projectRate: number | null;
  availability: string | null;
  city: string | null;
  country: string | null;
  ratingAvg: number;
  reviewCount: number;
  likesCount: number;
}

const LIKES_KEY = "prolorg-likes";
const SWIPE_MIN = 60;

function loadLikes(): Set<string> {
  try {
    const raw = localStorage.getItem(LIKES_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(arr) ? arr.filter((s) => typeof s === "string") : []);
  } catch {
    return new Set();
  }
}

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"} stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function ChevronLeft() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      {muted ? (
        <>
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </>
      ) : (
        <>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </>
      )}
    </svg>
  );
}

// Swipeable AI pro viewer (TikTok-style feed). Swipe left/right, use the
// arrows, or the keyboard to move between AI pros. AI pros with an uploaded
// intro video autoplay it (muted; tap to unmute). Heart likes the AI pro
// (saved locally), person icon opens the full profile.
export default function WatchFeed({
  experts,
  startSlug,
}: {
  experts: WatchExpert[];
  startSlug: string | null;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(() => {
    if (!experts.length) return 0;
    const found = startSlug ? experts.findIndex((e) => e.slug === startSlug) : -1;
    return found >= 0 ? found : 0;
  });
  const [likes, setLikes] = useState<Set<string>>(() => new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(experts.map((e) => [e.id, e.likesCount]))
  );
  const [muted, setMuted] = useState(true);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    setLikes(loadLikes());
  }, []);

  useEffect(() => {
    setMuted(true); // each AI pro's video starts muted
  }, [index]);

  const go = useCallback(
    (next: number) => {
      if (!experts.length) return;
      const wrapped = (next + experts.length) % experts.length;
      setIndex(wrapped);
      router.replace(`/watch?expert=${experts[wrapped].slug}`, { scroll: false });
    },
    [experts, router]
  );

  const prev = useCallback(() => go(index - 1), [go, index]);
  const next = useCallback(() => go(index + 1), [go, index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next]);

  // Heart: toggles the local liked state and keeps the public count on the
  // server in sync (per-browser de-dupe via localStorage).
  const toggleLike = useCallback((slug: string, id: string) => {
    setLikes((prevLikes) => {
      const nextLikes = new Set(prevLikes);
      const liking = !nextLikes.has(slug);
      if (liking) nextLikes.add(slug);
      else nextLikes.delete(slug);
      try {
        localStorage.setItem(LIKES_KEY, JSON.stringify([...nextLikes]));
      } catch {
        /* private mode — like just won't persist */
      }
      fetch(`/api/experts/${id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta: liking ? 1 : -1 }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => {
          if (j && typeof j.likesCount === "number") {
            setLikeCounts((prev) => ({ ...prev, [id]: j.likesCount }));
          }
        })
        .catch(() => {
          /* count sync is best-effort; the heart state is local */
        });
      return nextLikes;
    });
  }, []);

  if (!experts.length) {
    return (
      <div className="container">
        <div className="empty-state">
          <h2>No AI pro videos yet</h2>
          <p>The directory is still filling up. Browse the list or be the first AI pro on it.</p>
          <div className="hero-ctas">
            <Link href="/experts" className="btn btn-outline">Browse AI pros</Link>
            <Link href="/join" className="btn btn-orange">Join as an AI pro</Link>
          </div>
        </div>
      </div>
    );
  }

  const expert = experts[index];
  const liked = likes.has(expert.slug);
  const location = [expert.city, expert.country].filter(Boolean).join(", ");
  const hue = avatarHue(expert.name);
  const photoSrc = expert.hasPhoto
    ? `/api/experts/media/${expert.id}/photo`
    : expert.photoUrl;

  return (
    <div className="watch">
      <div
        className="watch-stage"
        onTouchStart={(e) => {
          touchX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (dx <= -SWIPE_MIN) next();
          else if (dx >= SWIPE_MIN) prev();
        }}
      >
        {expert.hasVideo ? (
          <video
            key={expert.id}
            className="watch-video"
            src={`/api/experts/media/${expert.id}/video`}
            poster={photoSrc ?? undefined}
            autoPlay
            muted={muted}
            loop
            playsInline
            preload="metadata"
            onClick={() => setMuted((m) => !m)}
            aria-label={`${expert.name} intro video${muted ? " (muted, tap to unmute)" : ""}`}
          />
        ) : photoSrc ? (
          <img src={photoSrc} alt={`${expert.name} intro`} className="watch-photo" />
        ) : (
          <div
            className="watch-photo-fallback"
            style={{
              background: `linear-gradient(135deg, hsl(${hue} 60% 38%), hsl(${(hue + 50) % 360} 60% 24%))`,
            }}
          >
            <span aria-hidden="true">{initials(expert.name)}</span>
          </div>
        )}
        <div className="watch-shade" aria-hidden="true" />

        <div className="watch-top">
          <Link href="/experts" className="watch-back" aria-label="Back to AI pro list">
            <BackIcon />
            <span>AI pros</span>
          </Link>
          <span className="watch-count" aria-live="polite">
            {index + 1} / {experts.length}
          </span>
        </div>

        {expert.hasVideo && (
          <button
            type="button"
            className="watch-mute"
            onClick={() => setMuted((m) => !m)}
            aria-pressed={!muted}
            aria-label={muted ? "Unmute video" : "Mute video"}
            title={muted ? "Unmute" : "Mute"}
          >
            <SpeakerIcon muted={muted} />
          </button>
        )}

        <div className="watch-rail">
          <div className="watch-like-wrap">
            <button
              type="button"
              className={`watch-action${liked ? " liked" : ""}`}
              aria-pressed={liked}
              aria-label={liked ? `Unlike ${expert.name}` : `Like ${expert.name}`}
              title="Like this AI pro"
              onClick={() => toggleLike(expert.slug, expert.id)}
            >
              <HeartIcon filled={liked} />
            </button>
            <span className="watch-like-count" aria-label={`${likeCounts[expert.id] ?? 0} likes`}>
              {likeCounts[expert.id] ?? 0}
            </span>
          </div>
          <Link
            href={`/experts/${expert.slug}`}
            className="watch-action"
            aria-label={`View ${expert.name}'s full profile`}
            title="View full profile"
          >
            <PersonIcon />
          </Link>
        </div>

        <div className="watch-info">
          <p className="watch-specialty">{expert.specialty}</p>
          <h2 className="watch-name">{expert.name}</h2>
          <p className="watch-headline">{expert.headline}</p>
          <div className="watch-facts">
            {location && <span>{location}</span>}
            {expert.availability && <span>{expert.availability}</span>}
            <span className="watch-rate">{formatRate(expert.hourlyRate, expert.projectRate)}</span>
          </div>
          {expert.skills.length > 0 && (
            <ul className="watch-skills" aria-label="Skills">
              {expert.skills.slice(0, 5).map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="watch-nav">
          <button type="button" className="watch-nav-btn" onClick={prev} aria-label="Previous AI pro">
            <ChevronLeft />
          </button>
          <div className="watch-dots" aria-hidden="true">
            {experts.map((e, i) => (
              <span key={e.slug} className={i === index ? "on" : undefined} />
            ))}
          </div>
          <button type="button" className="watch-nav-btn" onClick={next} aria-label="Next AI pro">
            <ChevronRight />
          </button>
        </div>
      </div>
      <p className="watch-hint">Swipe or use the arrows to browse AI pros</p>
    </div>
  );
}
