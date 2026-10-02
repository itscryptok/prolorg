"use client";

import { useCallback, useEffect, useState } from "react";
import { formatRate } from "@/lib/experts";
import { FLAG_THRESHOLD, PAYMENT_FLAG_THRESHOLD } from "@/lib/moderation";

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
  samples: { id: string; title: string; description: string; hasImage: boolean }[];
};

async function logout() {
  await fetch("/api/admin/logout", { method: "POST" });
  window.location.reload();
}

const REASON_LABELS: Record<string, string> = {
  email: "Email address",
  "email-obfuscated": "Obfuscated email",
  "email-spaced": "Spaced-out email",
  phone: "Phone number",
  "phone-spaced": "Spaced-out phone",
  "phone-spelled-out": "Spelled-out phone",
  "off-platform-channel": "Off-platform channel",
  "contact-phrase": "Contact-sharing phrase",
  "payment-link": "Payment link",
  "wallet-address": "Wallet address",
  "payment-phrase": "Payment details phrase",
};

function ViolationsPanel() {
  const [violations, setViolations] = useState<
    {
      id: string;
      userId: string;
      userEmail: string;
      userName: string;
      userBlocked: boolean;
      userViolationCount: number;
      conversationId: string | null;
      reasons: string;
      excerpt: string;
      createdAt: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/violations");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not load violations.");
      setViolations(json.violations ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load violations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setBlocked(userId: string, isBlocked: boolean) {
    if (isBlocked && !window.confirm("Block this account? They won't be able to log in or message.")) {
      return;
    }
    setBusy(userId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBlocked }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Action failed.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      {loading && <p>Loading violations…</p>}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      {!loading && !error && violations.length === 0 && (
        <div className="empty-state">
          <h2>No violations</h2>
          <p>No contact-evasion attempts detected so far.</p>
        </div>
      )}
      <div className="admin-list">
        {violations.map((v) => (
          <article key={v.id} className="admin-card">
            <div className="admin-card-head">
              <div>
                <strong>{v.userName}</strong>{" "}
                <span className="admin-sub">{v.userEmail}</span>
              </div>
              <div className="admin-card-badges">
                <span className="pill">
                  {v.userViolationCount} violation{v.userViolationCount === 1 ? "" : "s"}
                </span>
                {v.userBlocked && <span className="pill pill-red">Blocked</span>}
              </div>
            </div>
            <p className="admin-sub">
              {v.reasons
                .split(",")
                .map((r) => REASON_LABELS[r.trim()] ?? r.trim())
                .join(", ")}{" "}
              · {new Date(v.createdAt).toLocaleString()}
            </p>
            <p className="violation-excerpt">&ldquo;{v.excerpt}&rdquo;</p>
            <div className="hire-actions">
              {v.userBlocked ? (
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={busy === v.userId}
                  onClick={() => setBlocked(v.userId, false)}
                >
                  {busy === v.userId ? "Working…" : "Unblock account"}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={busy === v.userId}
                  onClick={() => setBlocked(v.userId, true)}
                >
                  {busy === v.userId ? "Working…" : "Block account"}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
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
        {expert.samples.length > 0 && (
          <div className="admin-samples">
            <strong>Sample work ({expert.samples.length})</strong>
            <ul>
              {expert.samples.map((s) => (
                <li key={s.id}>
                  <span>{s.title}</span>
                  {s.hasImage && <em> · has image</em>}
                  <p>{s.description}</p>
                </li>
              ))}
            </ul>
          </div>
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

type FlagReport = {
  id: string;
  kind: string;
  reporterName: string | null;
  details: string | null;
  reasons: string | null;
  createdAt: string;
};

type ModeratedExpert = {
  id: string;
  slug: string;
  name: string;
  headline: string;
  specialty: string;
  status: string;
  flagCount: number;
  paymentFlagCount: number;
  isDeactivated: boolean;
  createdAt: string;
  flagReports: FlagReport[];
};

function ModeratedExpertCard({
  expert: e,
  busy,
  onToggleDeactivate,
  onDismissFlag,
}: {
  expert: ModeratedExpert;
  busy: string | null;
  onToggleDeactivate: (id: string, deactivated: boolean, name: string) => void;
  onDismissFlag: (expertId: string, reportId: string) => void;
}) {
  const [showFlags, setShowFlags] = useState(false);
  const needsReview =
    e.flagCount >= FLAG_THRESHOLD ||
    e.paymentFlagCount >= PAYMENT_FLAG_THRESHOLD;

  return (
    <article className="admin-card">
      <div className="admin-card-head">
        <div>
          <strong>{e.name}</strong>{" "}
          <span className="admin-sub">{e.headline}</span>
        </div>
        <div className="admin-card-badges">
          <span className={`flag-count${e.flagCount >= FLAG_THRESHOLD ? " at-threshold" : ""}`}>
            &#128681; {e.flagCount}/{FLAG_THRESHOLD} member
          </span>
          <span className={`flag-count${e.paymentFlagCount >= PAYMENT_FLAG_THRESHOLD ? " at-threshold" : ""}`}>
            &#128179; {e.paymentFlagCount}/{PAYMENT_FLAG_THRESHOLD} payment
          </span>
          {needsReview && (
            <span className="pill pill-red">needs your review</span>
          )}
          <span className="pill">{e.status}</span>
          {e.isDeactivated && <span className="pill pill-red">Deactivated</span>}
        </div>
      </div>
      <p className="admin-sub">
        {e.specialty} &middot; since {new Date(e.createdAt).toLocaleDateString()}
      </p>
      {e.flagReports.length > 0 && (
        <div className="flag-details">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            aria-expanded={showFlags}
            onClick={() => setShowFlags((v) => !v)}
          >
            {showFlags ? "Hide" : "Show"} flag details ({e.flagReports.length})
          </button>
          {showFlags && (
            <ul className="flag-report-list">
              {e.flagReports.map((r) => (
                <li key={r.id} className="flag-report">
                  <div className="flag-report-head">
                    <span className={`pill${r.kind === "PAYMENT" ? " pill-red" : ""}`}>
                      {r.kind === "PAYMENT" ? "Payment flag" : "Member flag"}
                    </span>
                    {r.reporterName && (
                      <strong>by {r.reporterName}</strong>
                    )}
                    <span className="admin-sub">
                      {new Date(r.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {r.reasons && (
                    <p className="admin-sub">
                      {r.reasons
                        .split(",")
                        .map((x) => REASON_LABELS[x.trim()] ?? x.trim())
                        .join(", ")}
                    </p>
                  )}
                  {r.details && (
                    <p className="flag-report-details">&ldquo;{r.details}&rdquo;</p>
                  )}
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    disabled={busy === r.id}
                    onClick={() => onDismissFlag(e.id, r.id)}
                  >
                    {busy === r.id ? "Dismissing…" : "Dismiss flag"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <div className="hire-actions">
        {e.isDeactivated ? (
          <button
            type="button"
            className="btn btn-orange"
            disabled={busy === e.id}
            onClick={() => onToggleDeactivate(e.id, false, e.name)}
          >
            {busy === e.id ? "Working&hellip;" : "Reactivate"}
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-outline"
            disabled={busy === e.id}
            onClick={() => onToggleDeactivate(e.id, true, e.name)}
          >
            {busy === e.id ? "Working&hellip;" : "Deactivate"}
          </button>
        )}
      </div>
    </article>
  );
}

function ExpertsPanel() {
  const [experts, setExperts] = useState<ModeratedExpert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/experts");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not load AI pros.");
      setExperts(json.experts ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load AI pros.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setDeactivated(id: string, deactivated: boolean, name: string) {
    if (
      deactivated &&
      !window.confirm(`Deactivate ${name}? They'll disappear from /experts and /watch.`)
    ) {
      return;
    }
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/experts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deactivated }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Action failed.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(null);
    }
  }

  async function dismissFlag(expertId: string, reportId: string) {
    if (!window.confirm("Dismiss this flag report? The flag count goes down by one.")) {
      return;
    }
    setBusy(reportId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/flags/${reportId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Action failed.");
      setExperts((prev) =>
        prev.map((e) => {
          if (e.id !== expertId) return e;
          const report = e.flagReports.find((r) => r.id === reportId);
          return {
            ...e,
            flagReports: e.flagReports.filter((r) => r.id !== reportId),
            flagCount:
              report?.kind === "PAYMENT"
                ? e.flagCount
                : Math.max(0, e.flagCount - 1),
            paymentFlagCount:
              report?.kind === "PAYMENT"
                ? Math.max(0, e.paymentFlagCount - 1)
                : e.paymentFlagCount,
          };
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      {loading && <p>Loading AI pros…</p>}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <div className="admin-list">
        {experts.map((e) => (
          <ModeratedExpertCard
            key={e.id}
            expert={e}
            busy={busy}
            onToggleDeactivate={setDeactivated}
            onDismissFlag={dismissFlag}
          />
        ))}
      </div>
    </div>
  );
}

function ApprovalsPanel({
  pending,
  loading,
  error,
  reload,
}: {
  pending: Pending[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}) {
  return (
    <div>
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
          <PendingCard key={e.id} expert={e} onDone={reload} />
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState<"approvals" | "violations" | "experts">("approvals");
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
          <h1>
            {tab === "approvals"
              ? "AI pro approvals"
              : tab === "violations"
                ? "Contact-evasion violations"
                : "AI pro moderation"}
          </h1>
          <p className="admin-sub">
            {tab === "approvals"
              ? `${pending.length} application${pending.length === 1 ? "" : "s"} waiting for review.`
              : tab === "violations"
                ? "Accounts that tried to share contact details in the inbox."
                : `Flag counts per AI pro — ${FLAG_THRESHOLD} member flags or ${PAYMENT_FLAG_THRESHOLD} payment flags mark a pro as needing your review. Never auto-deactivates.`}
          </p>
        </div>
        <button type="button" className="btn btn-outline" onClick={logout}>
          Sign out
        </button>
      </div>

      <div className="admin-tabs" role="tablist" aria-label="Admin sections">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "approvals"}
          className={`admin-tab${tab === "approvals" ? " selected" : ""}`}
          onClick={() => setTab("approvals")}
        >
          Approvals
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "violations"}
          className={`admin-tab${tab === "violations" ? " selected" : ""}`}
          onClick={() => setTab("violations")}
        >
          Violations
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "experts"}
          className={`admin-tab${tab === "experts" ? " selected" : ""}`}
          onClick={() => setTab("experts")}
        >
          AI pros
        </button>
      </div>

      {tab === "approvals" ? (
        <ApprovalsPanel pending={pending} loading={loading} error={error} reload={load} />
      ) : tab === "violations" ? (
        <ViolationsPanel />
      ) : (
        <ExpertsPanel />
      )}
    </div>
  );
}
