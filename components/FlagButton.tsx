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

  useEffect(() => {
    setFlagged(loadFlagged().has(expertId));
  }, [expertId]);

  async function flag() {
    if (flagged || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/experts/${expertId}/flag`, { method: "POST" });
      if (!res.ok) throw new Error("flag failed");
      const next = loadFlagged();
      next.add(expertId);
      try {
        localStorage.setItem(FLAG_STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        /* private mode — flag just won't persist locally */
      }
      setFlagged(true);
    } catch {
      /* best-effort; user can retry */
    } finally {
      setBusy(false);
    }
  }

  if (variant === "watch") {
    return (
      <button
        type="button"
        className={`watch-action${flagged ? " flagged" : ""}`}
        aria-pressed={flagged}
        aria-label={flagged ? `You flagged ${expertName} for review` : `Flag ${expertName} for review`}
        title={flagged ? "Flagged — thanks, we'll review this pro" : "Flag this pro"}
        onClick={flag}
        disabled={flagged || busy}
      >
        <FlagIcon />
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`flag-btn${flagged ? " flagged" : ""}`}
      aria-pressed={flagged}
      aria-label={flagged ? `You flagged ${expertName} for review` : `Flag ${expertName} for review`}
      title={flagged ? "Flagged — thanks, we'll review this pro" : "Flag this pro"}
      onClick={flag}
      disabled={flagged || busy}
    >
      <FlagIcon />
      <span>{flagged ? "Flagged" : busy ? "Flagging…" : "Flag this pro"}</span>
    </button>
  );
}
