"use client";

import { useEffect, useRef, useState } from "react";
import { unlockFeeLabel } from "@/lib/unlock";

// "Share direct contact" popover in the inbox chat.
// Clicking the button opens an explainer first — what the unlock is, what
// it costs, and that it covers exactly one client/AI pro pair — with the
// pay action inside. The pay button redirects to Stripe Checkout
// (Yemi 2026-10-02); canPay comes from GET /api/unlocks/status because
// client components cannot read the server's STRIPE_SECRET_KEY.
export default function ContactUnlockPopover({
  conversationId,
  myName,
  otherName,
  unlocked: unlockedProp,
}: {
  conversationId: string;
  myName: string;
  otherName: string;
  unlocked: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [canPay, setCanPay] = useState(false);
  const [feeLabel, setFeeLabel] = useState(unlockFeeLabel());
  const [unlocked, setUnlocked] = useState(unlockedProp);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
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
  }, [open]);

  // Ask the server whether this pair is unlocked and whether the $1.50
  // payment flow is live (Stripe connected).
  useEffect(() => {
    let alive = true;
    fetch(`/api/unlocks/status?conversationId=${encodeURIComponent(conversationId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => {
        if (!alive || !s) return;
        setCanPay(!!s.canPay);
        if (s.feeLabel) setFeeLabel(s.feeLabel);
        if (s.unlocked) setUnlocked(true);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [conversationId]);

  async function startCheckout() {
    setPaying(true);
    setPayError(null);
    try {
      const res = await fetch("/api/unlocks/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.url) {
        window.location.href = data.url;
        return;
      }
      setPayError(
        data?.error === "This pair is already unlocked."
          ? "This pair is already unlocked."
          : "Couldn't start checkout. Please try again."
      );
    } catch {
      setPayError("Couldn't start checkout. Please try again.");
    }
    setPaying(false);
  }

  if (unlocked) {
    return (
      <span className="pill pill-ok" role="status">
        Direct contact unlocked for this pair
      </span>
    );
  }

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
            On Prolice AI, contact details stay locked by default — emails and
            phone numbers typed in the chat get flagged, and sharing them can
            get an account blocked.
          </p>
          <p>
            A one-time unlock fee lets you and {otherName} share direct
            contact details with each other. Either client or expert can pay
            to unlock limitless conversation so as to be able to exchange
            external communication details and payment details.
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

          <p className="unlock-pay-note" role="note">
            <strong>Payment rule:</strong> you can <em>discuss</em> payment in
            the Prolice AI chat, but <em>payment details</em> — card numbers,
            bank account details, wallet addresses, payment links — must be
            exchanged <em>outside</em> the app, only after unlocking. Sharing
            payment details in the chat will get your account banned.
          </p>

          <button
            type="button"
            className="btn btn-orange unlock-pay"
            disabled={!canPay || paying}
            aria-disabled={!canPay || paying}
            onClick={startCheckout}
          >
            {paying
              ? "Opening checkout…"
              : canPay
                ? `Pay ${feeLabel} to unlock this pair`
                : "Pay to unlock — coming soon"}
          </button>
          {payError && (
            <p className="unlock-pay-note" role="alert">
              {payError}
            </p>
          )}
          {!canPay && (
            <p className="unlock-pay-note" role="note">
              Payments aren't enabled yet — Stripe isn't connected. We'll
              announce it when it's live.
            </p>
          )}
        </div>
      )}
    </span>
  );
}
