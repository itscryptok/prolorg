"use client";

import { useState } from "react";

// "Message AI pro" button on expert profile pages.
// - Not signed in → send to /signup.
// - Signed in as a client → create (or reuse) the conversation and go to the inbox.
// - Signed in as an AI pro → explain only client accounts can hire.
export default function MessageExpertButton({ slug }: { slug: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notClient, setNotClient] = useState(false);

  async function onClick() {
    setBusy(true);
    setError(null);
    try {
      const meRes = await fetch("/api/auth/me");
      const meJson = await meRes.json();
      if (!meJson.user) {
        window.location.href = "/signup";
        return;
      }
      if (meJson.user.role !== "CLIENT") {
        setNotClient(true);
        return;
      }
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expertSlug: slug }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not start conversation.");
      window.location.href = `/inbox/${json.conversation.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start conversation.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        className="btn btn-orange profile-cta"
        onClick={onClick}
        disabled={busy}
      >
        {busy ? "Opening chat…" : "Message AI pro"}
      </button>
      {notClient && (
        <p className="fine-print" role="note">
          Only client accounts can message AI pros — your AI pro account uses
          the inbox to talk to your own clients.
        </p>
      )}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
    </div>
  );
}
