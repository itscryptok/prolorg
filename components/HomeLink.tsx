"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

// Home button to /. If already on the homepage, clicking scrolls back to
// the top instead of navigating (Yemi 2026-10-02).
export default function HomeLink({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  return (
    <Link
      href="/"
      className={`home-link ${className}`.trim()}
      aria-label="Prolice AI home"
      title="Prolice AI home"
      onClick={(e) => {
        if (pathname === "/") {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }}
    >
      <HomeIcon />
    </Link>
  );
}
