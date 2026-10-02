"use client";

import { useState } from "react";
import Link from "next/link";

// Payment-safety notice shown at the top of every inbox thread.
// Bare page text + an info icon that expands into scam-awareness tips.
export default function ChatSafetyNotice() {
  const [open, setOpen] = useState(false);

  return (
    <div className="safety-notice" role="note" aria-label="Chat safety rules">
      <div className="safety-notice-head">
        <span className="safety-info-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5" />
            <circle cx="12" cy="8" r="0.6" fill="currentColor" />
          </svg>
        </span>
        <p>
          <strong>Chat safety:</strong> you can <em>discuss</em> payment in this
          chat, but never share <em>payment details</em> here — no card numbers,
          bank account details, wallet addresses, or payment links. Our automated
          checks flag them, and violators will be banned. To exchange contact
          details, pay the $1.50 one-time unlock fee (either side can pay) — then
          exchange payment details <em>outside</em> the app.{" "}
          <button
            type="button"
            className="safety-toggle"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Hide scam-awareness tips" : "Beware of scams — read the tips"}
          </button>
        </p>
      </div>
      {open && (
        <ul className="safety-tips">
          <li>Never pay anyone a fee just to start work or to apply.</li>
          <li>
            Clients: hold your payment until the work is actually delivered.
            Experts: agree on an incremental delivery schedule with your client
            before you start, and collect payment at every stage as each one
            is delivered.
          </li>
          <li>Never share card, bank, ID, or login details in the chat.</li>
          <li>Be wary of payment links or anyone rushing you off the app before the $1.50 contact unlock.</li>
          <li>If a deal seems too good to be true, it probably is.</li>
          <li>
            Spotted something suspicious? Use the <strong>Flag</strong> button on
            the pro&apos;s profile or <Link href="/report-issue">report an issue</Link>.
          </li>
        </ul>
      )}
    </div>
  );
}
