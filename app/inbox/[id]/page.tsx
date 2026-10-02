"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ContactUnlockPopover from "@/components/ContactUnlockPopover";
import ChatSafetyNotice from "@/components/ChatSafetyNotice";
import BackButton from "@/components/BackButton";

type Thread = {
  id: string;
  unlockedContact: boolean;
  clientName: string;
  expertName: string;
  expertHeadline: string | null;
  expertSlug: string | null;
  myRole: "CLIENT" | "EXPERT";
};

type Msg = {
  id: string;
  senderId: string;
  mine: boolean;
  body: string;
  flagged: boolean;
  createdAt: string;
};

type Hire = {
  id: string;
  scope: string;
  price: number;
  agreement: string | null;
  status: string;
  createdAt: string;
};

const HIRE_LABELS: Record<string, string> = {
  REQUESTED: "Requested",
  ACCEPTED: "Accepted",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  OPEN: "Open",
  AGREED: "Agreed",
  CONFIRMED: "Confirmed",
};

function HireActions({
  hire,
  myRole,
  onDone,
}: {
  hire: Hire;
  myRole: "CLIENT" | "EXPERT";
  onDone: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(action: string) {
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(`/api/hires/${hire.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
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

  const btn = (action: string, label: string, cls = "btn btn-outline") => (
    <button
      key={action}
      type="button"
      className={cls}
      disabled={busy !== null}
      onClick={() => act(action)}
    >
      {busy === action ? "Working…" : label}
    </button>
  );

  const actions: React.ReactNode[] = [];
  if (hire.status === "REQUESTED" && myRole === "EXPERT") {
    actions.push(btn("accept", "Accept", "btn btn-orange"), btn("decline", "Decline"));
  }
  if (hire.status === "ACCEPTED") {
    actions.push(btn("start", "Start work", "btn btn-orange"));
    actions.push(btn("cancel", "Cancel"));
  }
  if (hire.status === "IN_PROGRESS") {
    actions.push(btn("complete", "Mark completed", "btn btn-orange"));
  }
  if (hire.status === "REQUESTED" && myRole === "CLIENT") {
    actions.push(btn("cancel", "Withdraw request"));
  }

  return (
    <div className="hire-actions">
      {actions}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
    </div>
  );
}

function ReviewForm({ hireId, onDone }: { hireId: string; onDone: () => void }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hireRequestId: hireId, rating, comment: comment.trim() || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Review failed.");
      setDone(true);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Review failed.");
    } finally {
      setBusy(false);
    }
  }

  if (done) return <p className="form-ok">Thanks — your review is live on their profile.</p>;

  return (
    <form onSubmit={submit} className="review-form">
      <strong>Leave a review</strong>
      <label className="auth-label">
        Rating
        <select
          className="auth-input"
          value={rating}
          onChange={(e) => setRating(parseInt(e.target.value, 10))}
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {"★".repeat(n)}{"☆".repeat(5 - n)}
            </option>
          ))}
        </select>
      </label>
      <label className="auth-label">
        Comment (optional)
        <textarea
          className="auth-input"
          rows={3}
          maxLength={2000}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="How did the work go?"
        />
      </label>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn-orange" disabled={busy}>
        {busy ? "Posting…" : "Post review"}
      </button>
    </form>
  );
}

function NewHireForm({ conversationId, onDone }: { conversationId: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState("");
  const [price, setPrice] = useState("");
  const [agreement, setAgreement] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/hires", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          scope: scope.trim(),
          price: parseInt(price, 10),
          agreement: agreement.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Hire request failed.");
      setOpen(false);
      setScope("");
      setPrice("");
      setAgreement("");
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hire request failed.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button type="button" className="btn btn-orange" onClick={() => setOpen(true)}>
        Request hire
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="hire-form">
      <strong>New hire request</strong>
      <label className="auth-label">
        Scope of work
        <textarea
          className="auth-input"
          rows={3}
          required
          minLength={10}
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          placeholder="What should the AI pro do, and what does done look like?"
        />
      </label>
      <label className="auth-label">
        Price (USD)
        <input
          className="auth-input"
          type="number"
          required
          min={1}
          max={1000000}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="e.g. 250"
        />
      </label>
      <label className="auth-label">
        Agreement (optional)
        <textarea
          className="auth-input"
          rows={3}
          maxLength={5000}
          value={agreement}
          onChange={(e) => setAgreement(e.target.value)}
          placeholder="Timeline, deliverables, revisions — anything you both agree to."
        />
      </label>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <div className="hire-actions">
        <button type="submit" className="btn btn-orange" disabled={busy}>
          {busy ? "Sending…" : "Send request"}
        </button>
        <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null);
  const [thread, setThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [hires, setHires] = useState<Hire[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/conversations/${id}/messages`);
      const json = await res.json();
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) throw new Error(json.error ?? "Could not load conversation.");
      setThread(json.conversation);
      setMessages(json.messages ?? []);
      setHires(json.hires ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load conversation.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || sending) return;
    setSending(true);
    setWarning(null);
    try {
      const res = await fetch(`/api/conversations/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: draft }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Message failed.");
      setDraft("");
      if (json.warning) setWarning(json.warning);
      await load();
    } catch (err) {
      setWarning(null);
      setError(err instanceof Error ? err.message : "Message failed.");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="container">
        <p>Loading conversation…</p>
      </div>
    );
  }

  return (
    <div className="container">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/inbox">Inbox</Link>
        <span aria-hidden="true"> / </span>
        <span>{thread?.expertName ?? thread?.clientName ?? "Conversation"}</span>
      </nav>

      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}

      {thread && (
        <>
          <div className="thread-head">
            <BackButton fallback="/inbox" label="Back to inbox" />
            <div>
              <h1>{thread.myRole === "CLIENT" ? thread.expertName : thread.clientName}</h1>
              {thread.myRole === "CLIENT" && thread.expertHeadline && (
                <p className="thread-sub">
                  {thread.expertSlug ? (
                    <Link href={`/experts/${thread.expertSlug}`}>{thread.expertHeadline}</Link>
                  ) : (
                    thread.expertHeadline
                  )}
                </p>
              )}
            </div>
            <div className="thread-head-actions">
              {thread.myRole === "CLIENT" && (
                <NewHireForm conversationId={thread.id} onDone={load} />
              )}
              <ContactUnlockPopover
                myName={thread.myRole === "CLIENT" ? thread.clientName : thread.expertName}
                otherName={thread.myRole === "CLIENT" ? thread.expertName : thread.clientName}
                unlocked={thread.unlockedContact}
              />
            </div>
          </div>

          <ChatSafetyNotice />

          {hires.length > 0 && (
            <section aria-label="Hire requests" className="hire-list">
              {hires.map((h) => (
                <article key={h.id} className="hire-card">
                  <div className="hire-card-head">
                    <strong>Hire request — ${h.price}</strong>
                    <span className="pill">{HIRE_LABELS[h.status] ?? h.status}</span>
                  </div>
                  <p className="hire-scope">{h.scope}</p>
                  {h.agreement && (
                    <p className="hire-agreement">
                      <strong>Agreed terms:</strong> {h.agreement}
                    </p>
                  )}
                  <HireActions hire={h} myRole={thread.myRole} onDone={load} />
                  {h.status === "COMPLETED" && thread.myRole === "CLIENT" && (
                    <ReviewForm hireId={h.id} onDone={load} />
                  )}
                </article>
              ))}
            </section>
          )}

          {warning && (
            <div className="warning-banner" role="alert">
              {warning}
            </div>
          )}

          <div className="message-list" aria-live="polite">
            {messages.length === 0 && (
              <p className="inbox-preview">No messages yet — say hello.</p>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`message${m.mine ? " mine" : ""}`}>
                <p>{m.body}</p>
                {m.flagged && (
                  <p className="message-warning" role="alert">
                    <strong>Flagged:</strong> this message looks like it
                    contains contact or payment details. These don&apos;t
                    belong in the chat — sharing them can get your account
                    blocked.
                  </p>
                )}
                <span className="message-meta">
                  <time dateTime={m.createdAt}>
                    {new Date(m.createdAt).toLocaleString()}
                  </time>
                  {m.flagged && <em> · flagged for review</em>}
                </span>
              </div>
            ))}
          </div>

          <form onSubmit={send} className="composer">
            <label className="sr-only" htmlFor="message-draft">
              Write a message
            </label>
            <textarea
              id="message-draft"
              className="auth-input"
              rows={2}
              maxLength={5000}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write a message…"
            />
            <button type="submit" className="btn btn-orange" disabled={sending || !draft.trim()}>
              {sending ? "Sending…" : "Send"}
            </button>
          </form>
          <p className="fine-print">
            Never share payment details in this chat — card numbers, bank
            details, wallet addresses, or payment links. Violators will be
            banned. Discuss payment here; exchange payment details only outside
            the app after the $1.50 contact unlock. Beware of scams and report
            anything suspicious.
          </p>
        </>
      )}
    </div>
  );
}
