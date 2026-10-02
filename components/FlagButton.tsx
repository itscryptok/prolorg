"use client";

import { useEffect, useState } from "react";
import { FLAG_STORAGE_KEY } from "@/lib/moderation";

function loadFlagged(): Set<string> {
  try {
    const raw = localStorage.getItem(FLAG_STORAGE_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : []);
  } catch {
    return new Set();
  }
}

function FlagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}

// "Flag this pro" button: one flag per browser (localStorage de-dupe, same
// approach as /watch likes). Used on /experts cards and /watch videos.
//
// Tapping it opens a popup asking for the reporter's username and details —
// the flag must come from another member, and Yemi reviews every report in
// /addy with the username + details attached. Signed-in members get their
// username prefilled from /api/auth/me.
export default function FlagButton({
  expertId,
  expertName,
  variant = "card",
}: {
  expertId: string;
  expertName: string;
  variant?: "card" | "watch";
}) {
  const [flagged, setFlagged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [reporterName, setReporterName] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string | null>(null);
  // null = still checking, true/false = signed-in state from /api/auth/me.
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  // Shown to logged-out visitors the moment they tap into any field.
  const [loginGate, setLoginGate] = useState(false);

  useEffect(() => {
    setFlagged(loadFlagged().has(expertId));
  }, [expertId]);

  // Check sign-in state when the popup opens; prefill the reporter's
  // username when they're signed in.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setSignedIn(null);
    setLoginGate(false);
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (cancelled) return;
        if (json?.user) {
          setSignedIn(true);
          if (json.user.name) setReporterName(json.user.name);
        } else {
          setSignedIn(false);
        }
      })
      .catch(() => {
        if (!cancelled) setSignedIn(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open ]);

  // Logged-out visitors may see the form, but tapping into any field asks
  // them to log in first — flags can't be sent anonymously.
  function requireLoginOnFocus() {
    if (signedIn === false) setLoginGate(true);
  }

  async function submit() {
    if (signedIn === false) {
      setLoginGate(true);
      return;
    }
    const name = reporterName.trim();
    const what = details.trim();
    if (!name || !what) {
      setError("Please add your username and a few details about what happened.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/experts/${expertId}/flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reporterName: name, details: what }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Flag failed — please try again.");
      const next = loadFlagged();
      next.add(expertId);
      try {
        localStorage.setItem(FLAG_STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        /* private mode — flag just won't persist locally */
      }
      setFlagged(true);
      setOpen(false);
      setDetails("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Flag failed — please try again.");
    } finally {
      setBusy(false);
    }
  }

  function openPopup() {
    if (flagged || busy) return;
    setError(null);
    setOpen(true);
  }

  const buttonProps = {
    type: "button" as const,
    "aria-pressed": flagged,
    "aria-label": flagged ? `You flagged ${expertName} for review` : `Flag ${expertName} for review`,
    title: flagged ? "Flagged — thanks, we'll review this pro" : "Flag this pro",
    onClick: openPopup,
    disabled: flagged || busy,
  };

  return (
    <>
      {variant === "watch" ? (
        <button {...buttonProps} className={`watch-action${flagged ? " flagged" : ""}`}>
          <FlagIcon />
        </button>
      ) : (
        <button {...buttonProps} className={`flag-btn${flagged ? " flagged" : ""}`}>
          <FlagIcon />
          <span>{flagged ? "Flagged" : busy ? "Flagging…" : "Flag this pro"}</span>
        </button>
      )}

      {open && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="flag-popup-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="modal-card">
            <h2 id="flag-popup-title">Flag {expertName} for review</h2>
            {loginGate ? (
              <>
                <p className="modal-sub">
                  Log in first to send a flag — flags come from members, so we
                  need to know who&apos;s reporting.
                </p>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </button>
                  <a className="btn btn-orange" href="/login">
                    Log in
                  </a>
                </div>
              </>
            ) : (
              <>
            <p className="modal-sub">
              Flags come from members like you — never from the pro themselves.
              Our team reviews every report. Flag counts are never shown publicly.
            </p>
            <label className="form-label" htmlFor="flag-reporter">
              Your username
            </label>
            <input
              id="flag-reporter"
              className="auth-input"
              type="text"
              maxLength={80}
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
              onFocus={requireLoginOnFocus}
              placeholder="e.g. yemi_g"
              autoComplete="username"
            />
            <label className="form-label" htmlFor="flag-details">
              What happened?
            </label>
            <textarea
              id="flag-details"
              className="auth-input"
              rows={4}
              maxLength={2000}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              onFocus={requireLoginOnFocus}
              placeholder="Describe what the pro did — messages, payment requests, links, anything relevant."
            />
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setOpen(false)}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-orange"
                onClick={submit}
                disabled={busy}
              >
                {busy ? "Sending…" : "Send flag"}
              </button>
            </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
