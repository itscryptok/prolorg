import Link from "next/link";

export function HomeIcon() {
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
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

// Home button to /. Lives in the site header before the watch play button
// (same bordered style), on desktop and mobile.
export default function HomeLink({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`home-link ${className}`.trim()}
      aria-label="AiProlice home"
      title="AiProlice home"
    >
      <HomeIcon />
    </Link>
  );
}
