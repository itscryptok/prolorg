import Link from "next/link";

export function PlayIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
  );
}

// Play button to /watch. Lives in the site header next to the day/night
// toggle (same bordered style), on desktop and mobile.
export default function WatchLink({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/watch"
      className={`watch-link ${className}`.trim()}
      aria-label="Watch AI pro intros"
      title="Watch AI pro intros"
    >
      <PlayIcon />
    </Link>
  );
}
