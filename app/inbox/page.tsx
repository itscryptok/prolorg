"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Conversation = {
  id: string;
  createdAt: string;
  otherName: string;
  otherRole: string;
  expertHeadline: string | null;
  expertSlug: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
};

// Inbox: the signed-in user's conversations with clients / AI pros.
export default function InboxPage() {
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/conversations");
        const json = await res.json();
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        if (!res.ok) throw new Error(json.error ?? "Could not load inbox.");
        setConvos(json.conversations ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load inbox.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="container">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true"> / </span>
        <span>Inbox</span>
      </nav>
      <h1>Inbox</h1>

      {loading && <p>Loading conversations…</p>}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      {!loading && !error && convos.length === 0 && (
        <div className="empty-state">
          <h2>No conversations yet</h2>
          <p>
            Browse the <Link href="/experts">AI pro directory</Link> and tap
            “Message AI pro” to start your first conversation.
          </p>
        </div>
      )}
      <div className="inbox-list">
        {convos.map((c) => (
          <Link key={c.id} href={`/inbox/${c.id}`} className="inbox-row">
            <div className="inbox-row-main">
              <strong>{c.otherName}</strong>
              {c.expertHeadline && <span className="inbox-headline">{c.expertHeadline}</span>}
              {c.lastMessage && (
                <span className="inbox-preview">
                  {c.lastMessage.slice(0, 90)}
                  {c.lastMessage.length > 90 ? "…" : ""}
                </span>
              )}
            </div>
            <div className="inbox-row-meta">
              <span className="pill">{c.otherRole === "EXPERT" ? "AI pro" : "Client"}</span>
              {c.lastMessageAt && (
                <time dateTime={c.lastMessageAt}>
                  {new Date(c.lastMessageAt).toLocaleDateString()}
                </time>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
