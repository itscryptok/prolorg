"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import LogoMark from "./LogoMark";
import ThemeToggle from "./ThemeToggle";
import { useFilterPanel } from "./FilterPanelContext";

const NAV_LINKS = [
  { href: "/experts", label: "Find Experts" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/about", label: "About" },
  { href: "/login", label: "Login" },
];

// Sticky site header: logo left, filter toggle icon between the logo and the
// menu (opens the advanced-search panel on /experts, highlighted while open),
// nav center/right, theme toggle below the nav on desktop and left of the
// hamburger on mobile, orange Sign Up pill,
// hamburger menu with slide-out panel on mobile.
function FilterIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="22 3 2 3 10 12.5 10 19 14 21 14 12.5 22 3" />
    </svg>
  );
}

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const {
    open: filtersOpen,
    toggle: toggleFilters,
    setOpen: setFiltersOpen,
  } = useFilterPanel();

  const onFilterClick = () => {
    if (pathname === "/experts") {
      toggleFilters();
    } else {
      // From any other page: go to the directory with the panel open.
      setFiltersOpen(true);
      router.push("/experts");
    }
  };

  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <Link href="/" className="brand" aria-label="Prolorg home">
          <LogoMark size={34} />
          <span className="brand-name">Prolorg</span>
        </Link>
        <div className="header-icons" aria-label="Search tools">
          <button
            type="button"
            onClick={onFilterClick}
            aria-label={filtersOpen ? "Hide search filters" : "Show search filters"}
            title="Filter experts"
            aria-expanded={filtersOpen}
            className={filtersOpen ? "active" : undefined}
          >
            <FilterIcon />
          </button>
        </div>
        <div className="header-menu-col">
          <nav className="site-nav" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
            <Link href="/signup" className="btn btn-orange" style={{ padding: "0.55rem 1.4rem" }}>
              Sign Up
            </Link>
          </nav>
          <ThemeToggle className="theme-toggle-desktop" />
        </div>
        <div className="header-mobile-actions">
          <ThemeToggle className="theme-toggle-mobile" />
          <button
            type="button"
            className="menu-button"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>
      <nav
        id="mobile-menu"
        className={`mobile-panel${open ? " open" : ""}`}
        aria-label="Mobile"
      >
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
            {link.label}
          </Link>
        ))}
        <Link href="/signup" onClick={() => setOpen(false)}>
          Sign Up
        </Link>
      </nav>
    </header>
  );
}
