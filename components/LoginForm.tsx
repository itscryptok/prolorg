"use client";

import { useState } from "react";
import Link from "next/link";
import LogoMark from "./LogoMark";

type Status = { ok: boolean; message: string } | null;

// Login form: email + password. On success the account is signed in and
// sent to the inbox (clients) or the AI pro dashboard (AI pros).
export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Login failed.");
      window.location.href = json.user.role === "EXPERT" ? "/dashboard" : "/inbox";
    } catch (err) {
      setStatus({ ok: false, message: err instanceof Error ? err.message : "Login failed." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <LogoMark size={48} />
        <h1>Log in</h1>
        <p className="auth-sub">Welcome back to AiProlice.</p>
        <form onSubmit={onSubmit} className="auth-form">
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
              autoComplete="current-password"
            />
          </label>

          {status && (
            <p role="alert" className={status.ok ? "form-ok" : "form-error"}>
              {status.message}
            </p>
          )}

          <button type="submit" className="btn btn-orange auth-submit" disabled={busy}>
            {busy ? "Logging in…" : "Log in"}
          </button>
        </form>
        <p className="auth-switch">
          New here? <Link href="/signup">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
