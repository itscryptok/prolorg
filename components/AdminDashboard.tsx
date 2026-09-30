"use client";

import { useCallback, useEffect, useState } from "react";
import { formatRate } from "@/lib/experts";

type Pending = {
  id: string;
  slug: string;
  name: string;
  headline: string;
  bio: string;
  specialty: string;
  skills: string[];
  hourlyRate: number | null;
  projectRate: number | null;
  availability: string | null;
  city: string | null;
  country: string | null;
  languages: string[];
  yearsExperience: number | null;
  createdAt: string;
  hasPhoto: boolean;
  hasVideo: boolean;
};

async function logout() {
  await fetch("/api/admin/logout", { method: "POST" });
  window.location.reload();
}

function PendingCard({
  expert,
  onDone,
}: {
  expert: Pending;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const location = [expert.city, expert.country].filter(Boolean).join(", ");

  async function act(kind: "APPROVED" | "REJECTED" | "DELETE") {
    if (kind === "DELETE" && !window.confirm(`Delete ${expert.name}'s application permanently?`)) {
      return;
    }
    setBusy(kind);
    setError(null);
    try {
      const res = await fetch(`/api/admin/experts/${expert.id}`, {
        method: kind === "DELETE" ? "DELETE" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: kind === "DELETE" ? undefined : JSON.stringify({ status: kind }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Action failed.");
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <article className="admin-card">
      <div className="admin-card-media">
        {expert.hasPhoto ? (
          <img src={`/api/experts/media/${expert.id}/photo`} alt={`${expert.name}`} />
        ) : (
          <div className="admin-card-avatar" aria-hidden="true">
            {expert.name.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>
      <div className="admin-card-body">
        <div className="admin-card-head">
          <div>
            <span className="pill">{expert.specialty}</span>
            <h2>{expert.name}</h2>
            <p className="admin-headline">{expert.headline}</p>
          </div>
          <span className="admin-date">
            {expert.createdAt ? new Date(expert.createdAt).toLocaleDateString() : ""}
          </span>
        </div>
        <p className="admin-bio">{expert.bio}</p>
        <div className="admin-facts">
          {location && <span>{location}</span>}
          {expert.availability && <span>{expert.availability}</span>}
          <span>{formatRate(expert.hourlyRate, expert.projectRate)}</span>
          {expert.yearsExperience != null && <span>{expert.yearsExperience} yrs</span>}
          {expert.languages.length > 0 && <span>Speaks {expert.languages.join(", ")}</span>}
        </div>
        {expert.skills.length > 0 && (
          <ul className="skill-chips">
            {expert.skills.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        )}
        {expert.hasVideo && (
          <video
            className="admin-video"
            src={`/api/experts/media/${expert.id}/video`}
            controls
            playsInline
            preload="metadata"
          />
        )}
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <div className="admin-actions">
          <button
            type="button"
            className="btn btn-orange"
            disabled={busy !== null}
            onClick={() => act("APPROVED")}
          >
            {busy === "APPROVED" ? "Approving…" : "Approve"}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            disabled={busy !== null}
            onClick={() => act("REJECTED")}
          >
            {busy === "REJECTED" ? "Rejecting…" : "Reject"}
          </button>
          <button
            type="button"
            className="btn btn-danger"
            disabled={busy !== null}
            onClick={() => act("DELETE")}
          >
            {busy === "DELETE" ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function AdminDashboard() {
  const [pending, setPending] = useState<Pending[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/pending");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not load applications.");
      setPending(json.pending ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load applications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="admin-top">
        <div>
          <h1>AI pro approvals</h1>
          <p className="admin-sub">
            {pending.length} application{pending.length === 1 ? "" : "s"} waiting for review.
          </p>
        </div>
        <button type="button" className="btn btn-outline" onClick={logout}>
          Sign out
        </button>
      </div>

      {loading && <p>Loading applications…</p>}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      {!loading && !error && pending.length === 0 && (
        <div className="empty-state">
          <h2>All caught up</h2>
          <p>No pending AI pro applications right now.</p>
        </div>
      )}
      <div className="admin-list">
        {pending.map((e) => (
          <PendingCard key={e.id} expert={e} onDone={load} />
        ))}
      </div>
    </div>
  );
}
