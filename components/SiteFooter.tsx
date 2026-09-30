import Link from "next/link";
import LogoMark from "./LogoMark";
import { CONTACT_EMAIL, CONTACT_X } from "@/lib/site";

const FOOTER_NAV = [
  { href: "/", label: "Home" },
  { href: "/experts", label: "Find AI pros" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/about", label: "About" },
  { href: "/login", label: "Login" },
  { href: "/signup", label: "Sign Up" },
  { href: "/terms", label: "Terms of Use" },
  { href: "/privacy", label: "Privacy Policy" },
];

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">
              <LogoMark size={30} />
              <span className="brand-name">Prolorg</span>
            </div>
            <p className="footer-tag">
              Find your AI pro. Partner with or hire a vetted AI pro and
              get the work done through a private platform inbox.
            </p>
          </div>
          <nav className="footer-col" aria-label="Footer">
            <h4>Explore</h4>
            <ul>
              {FOOTER_NAV.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="footer-col">
            <h4>Contact</h4>
            <div className="footer-social">
              <a
                href={CONTACT_X}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Prolorg on X"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93zm-1.29 19.5h2.04L6.49 3.24H4.3l13.31 17.41z" />
                </svg>
                X
              </a>
              <a href={`mailto:${CONTACT_EMAIL}`} aria-label="Email Prolorg">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-10 6L2 7" />
                </svg>
                Email
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span className="made">
            Product of <strong>Cryp Tok Solutions</strong> 2026
          </span>
          <span>© 2026 Cryp Tok Solutions</span>
        </div>
      </div>
    </footer>
  );
}
