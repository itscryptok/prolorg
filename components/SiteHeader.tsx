"use client";

import Link from "next/link";
import { useState } from "react";
import LogoMark from "./LogoMark";
import ThemeToggle from "./ThemeToggle";

const NAV_LINKS = [
  { href: "/experts", label: "Find Experts" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/about", label: "About" },
  { href: "/login", label: "Login" },
];

// Sticky site header: logo left, nav center/right, orange Sign Up pill,
// hamburger menu with slide-out panel on mobile.
export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <Link href="/" className="brand" aria-label="Prolorg home">
          <LogoMark size={34} />
          <span className="brand-name">Prolorg</span>
        </Link>
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
