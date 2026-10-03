"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import LogoMark from "./LogoMark";
import BackButton from "./BackButton";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

type Status = { ok: boolean; message: string } | null;

// Signup form: name, email, password, and account type (client or AI pro).
// Cloudflare Turnstile CAPTCHA (Yemi 2026-10-03): the widget renders only
// when NEXT_PUBLIC_TURNSTILE_SITE_KEY is set; the server verifies the token
// only when TURNSTILE_SECRET_KEY is set. Until both keys are installed the
// form works exactly as before.
// On success the account is signed in immediately and sent to the inbox
// (clients) or the AI pro dashboard (AI pros).
export default function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"client" | "expert">("client");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileFailed, setTurnstileFailed] = useState(false);
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !widgetRef.current) return;
    let cancelled = false;
    const renderWidget = () => {
      if (cancelled || !window.turnstile || !widgetRef.current || widgetId.current) return;
      try {
        widgetId.current = window.turnstile.render(widgetRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: "light", // the auth card is white in both themes
          callback: (token: string) => setTurnstileToken(token),
          "expired-callback": () => setTurnstileToken(null),
          "error-callback": () => setTurnstileFailed(true),
        });
      } catch {
        if (!cancelled) setTurnstileFailed(true);
      }
    };
    if (window.turnstile) {
      renderWidget();
    } else {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = renderWidget;
      script.onerror = () => {
        if (!cancelled) setTurnstileFailed(true);
      };
      document.head.appendChild(script);
    }
    return () => {
      cancelled = true;
      if (window.turnstile && widgetId.current) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch {
          /* noop */
        }
        widgetId.current = null;
      }
    };
  }, []);

  function resetTurnstile() {
    setTurnstileToken(null);
    if (window.turnstile && widgetId.current) {
      try {
        window.turnstile.reset(widgetId.current);
      } catch {
        /* noop */
      }
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      if (TURNSTILE_SITE_KEY && !turnstileToken) {
        throw new Error("Please complete the CAPTCHA check.");
      }
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, turnstileToken }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Sign up failed.");
      const next =
        json.user.role === "EXPERT" ? "/dashboard" : "/inbox";
      window.location.href = next;
    } catch (err) {
      resetTurnstile();
      setStatus({ ok: false, message: err instanceof Error ? err.message : "Sign up failed." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <BackButton fallback="/" className="back-btn-corner" />
        <LogoMark size={48} />
        <h1>Join Prolice AI</h1>
        <p className="auth-sub">
          Hire AI pros through the platform inbox — or join as an AI pro and
          get hired.
        </p>
        <form onSubmit={onSubmit} className="auth-form">
          <div className="role-pick" role="radiogroup" aria-label="Account type">
            <button
              type="button"
              className={`role-option${role === "client" ? " selected" : ""}`}
              aria-pressed={role === "client"}
              onClick={() => setRole("client")}
            >
              <strong>I want to hire</strong>
              <span>Client account</span>
            </button>
            <button
              type="button"
              className={`role-option${role === "expert" ? " selected" : ""}`}
              aria-pressed={role === "expert"}
              onClick={() => setRole("expert")}
            >
              <strong>I&apos;m an AI pro</strong>
              <span>Offer your services</span>
            </button>
          </div>

          <label className="auth-label">
            Full name
            <input
              className="auth-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              maxLength={80}
              autoComplete="name"
            />
          </label>
          <label className="auth-label">
            Email
            <input
              className="auth-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label className="auth-label">
            Password
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>

          {status && (
            <p role="alert" className={status.ok ? "form-ok" : "form-error"}>
              {status.message}
            </p>
          )}

          {TURNSTILE_SITE_KEY && (
            <div className="turnstile-wrap">
              <div ref={widgetRef} />
              {turnstileFailed && (
                <p role="alert" className="form-error">
                  CAPTCHA could not load — check your connection and reload the page.
                </p>
              )}
            </div>
          )}

          <button type="submit" className="btn btn-orange auth-submit" disabled={busy}>
            {busy ? "Creating account…" : "Create account"}
          </button>
        </form>
        <p className="auth-switch">
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
