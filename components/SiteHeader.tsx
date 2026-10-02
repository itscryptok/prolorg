"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import LogoMark from "./LogoMark";
import ThemeToggle from "./ThemeToggle";
import HomeLink from "./HomeLink";
import WatchLink from "./WatchLink";

const BASE_LINKS = [
  { href: "/experts", label: "Find AI pros" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/about", label: "About" },
];

type Me = { role: string } | null;

// Sticky site header: logo left, nav center/right, theme toggle below the
// nav on desktop and left of the hamburger on mobile, orange Sign Up pill,
// hamburger menu with slide-out panel on mobile.
// (Watch play button sits beside the theme toggle; the filter toggle lives
// on the /experts toolbar, above the cards.)
export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState<Me | undefined>(undefined);
  const barsRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((j) => setMe(j.user ? { role: j.user.role } : null))
      .catch(() => setMe(null));
  }, []);

  // The header is sticky, but the decorative bars should scroll away with
  // the page instead of staying pinned to the viewport. Counteract the
  // header's stickiness by translating the bars up with the scroll offset.
  useEffect(() => {
    const el = barsRef.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      el.style.transform = `translateY(${-window.scrollY}px)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const signedIn = !!me;
  const navLinks = signedIn
    ? [
        ...BASE_LINKS,
        { href: "/inbox", label: "Inbox" },
        ...(me?.role === "EXPERT" ? [{ href: "/dashboard", label: "Dashboard" }] : []),
      ]
    : [...BASE_LINKS, { href: "/login", label: "Login" }];

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <header className="site-header">
      <img
        ref={barsRef}
        src="/black-fade-bars.png"
        alt=""
        aria-hidden="true"
        className="brand-bars"
      />
      <div className="container site-header-inner">
        <Link href="/" className="brand" aria-label="AiProlice home">
          <LogoMark size={34} />
          <span className="brand-name">AiProlice</span>
        </Link>
        <div className="header-menu-col">
          <nav className="site-nav" aria-label="Primary">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
            {signedIn ? (
              <button
                type="button"
                className="btn btn-orange"
                style={{ padding: "0.55rem 1.4rem" }}
                onClick={signOut}
              >
                Sign Out
              </button>
            ) : (
              <Link href="/signup" className="btn btn-orange" style={{ padding: "0.55rem 1.4rem" }}>
                Sign Up
              </Link>
            )}
          </nav>
          <div className="header-icon-row">
            <HomeLink className="home-link-desktop" />
            <WatchLink className="watch-link-desktop" />
            <ThemeToggle className="theme-toggle-desktop" />
          </div>
        </div>
        <div className="header-mobile-actions">
          <HomeLink />
          <WatchLink />
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
        <Link href="/#why" onClick={() => setOpen(false)}>
          Why AiProlice
        </Link>
        {navLinks
          .filter((link) => link.href !== "/login")
          .map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
        <div className="mobile-panel-auth">
          {signedIn ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                signOut();
              }}
            >
              Sign Out
            </button>
          ) : (
            <>
              <Link href="/login" onClick={() => setOpen(false)}>
                Login
              </Link>
              <Link href="/signup" onClick={() => setOpen(false)}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
