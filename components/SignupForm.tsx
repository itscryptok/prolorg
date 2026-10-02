"use client";

import { useState } from "react";
import Link from "next/link";
import LogoMark from "./LogoMark";
import BackButton from "./BackButton";

type Status = { ok: boolean; message: string } | null;

// Signup form: name, email, password, and account type (client or AI pro).
// On success the account is signed in immediately and sent to the inbox
// (clients) or the AI pro dashboard (AI pros).
export default function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"client" | "expert">("client");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Sign up failed.");
      const next =
        json.user.role === "EXPERT" ? "/dashboard" : "/inbox";
      window.location.href = next;
    } catch (err) {
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
        <h1>Join AiProlice</h1>
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
