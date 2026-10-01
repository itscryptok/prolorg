"use client";

import { useEffect, useRef, useState } from "react";
import { paymentsEnabled, unlockFeeLabel, STRIPE_CONNECTED, CONTACT_UNLOCK_FEE_USD } from "@/lib/unlock";

// "Share direct contact" popover in the inbox chat.
// Clicking the button opens an explainer first — what the unlock is, what
// it costs, and that it covers exactly one client/AI pro pair — with the
// pay action inside. The pay button stays in a "coming soon" state until
// Yemi sets the price and connects Stripe (see lib/unlock.ts).
export default function ContactUnlockPopover({
  myName,
  otherName,
  unlocked,
}: {
  myName: string;
  otherName: string;
  unlocked: boolean;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  // Close on Escape; close on clicks outside the popover.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (popRef.current?.contains(t) || buttonRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    popRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
      buttonRef.current?.focus();
    };
  }, [open ]);

  if (unlocked) {
    return (
      <span className="pill pill-ok" role="status">
        Direct contact unlocked for this pair
      </span>
    );
  }

  const canPay = paymentsEnabled();
  const feeLabel = unlockFeeLabel();
  const priceMissing = CONTACT_UNLOCK_FEE_USD == null;

  return (
    <span className="unlock-wrap">
      <button
        type="button"
        ref={buttonRef}
        className="btn btn-outline"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        Share direct contact
      </button>

      {open && (
        <div
          ref={popRef}
          role="dialog"
          aria-label="Share direct contact"
          tabIndex={-1}
          className="unlock-popover"
        >
          <div className="unlock-popover-head">
            <strong>Share direct contact</strong>
            <button
              type="button"
              className="unlock-close"
              aria-label="Close"
              onClick={() => setOpen(false)}
            >
              ✕
            </button>
          </div>

          <p>
            On AiProlice, contact details stay locked by default — emails and
            phone numbers typed in the chat get flagged, and sharing them can
            get an account blocked.
          </p>
          <p>
            A one-time unlock fee lets you and {otherName} share direct
            contact details with each other.
          </p>

          <ul className="unlock-facts">
            <li>
              <strong>Fee:</strong> {feeLabel}
              {canPay ? "" : " — paid once"}
            </li>
            <li>
              <strong>Covers this pair only:</strong> {myName} + {otherName}
            </li>
            <li>
              <strong>Either of you can pay</strong> — payment from either side
              unlocks the pair.
            </li>
          </ul>

          <button
            type="button"
            className="btn btn-orange unlock-pay"
            disabled={!canPay}
            aria-disabled={!canPay}
          >
            {canPay ? `Pay ${feeLabel} to unlock this pair` : "Pay to unlock — coming soon"}
          </button>
          {!canPay && (
            <p className="unlock-pay-note" role="note">
              {priceMissing && !STRIPE_CONNECTED
                ? "Payments aren't enabled yet — the unlock price hasn't been set and Stripe isn't connected."
                : priceMissing
                  ? "Payments aren't enabled yet — the unlock price hasn't been set."
                  : "Payments aren't enabled yet — Stripe isn't connected."}{" "}
              We'll announce it when it's live.
            </p>
          )}
        </div>
      )}
    </span>
  );
}
