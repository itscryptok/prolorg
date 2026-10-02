// Content moderation configuration.
//
// ================================================================
// YEMI'S SETTINGS (confirmed 2026-09-30, extended 2026-10-02):
// - FLAG_THRESHOLD = 7 (member "Flag this pro" reports)
// - PAYMENT_FLAG_THRESHOLD = 3 (auto-detected payment-detail violations
//   by the pro — kept SEPARATE from member flags; payment violations
//   escalate faster)
// - NO auto-deactivation: reaching either threshold only highlights the
//   pro in /addy ("needs your review"). A human (Yemi) decides whether
//   to deactivate, from the /addy "AI pros" tab.
// - Flag counts are NEVER public: they appear only in /addy. Public
//   pro cards and /watch videos show the "Flag this pro" button with
//   no counts.
// ================================================================
export const FLAG_THRESHOLD = 7;

// Auto-detected payment-practice violations (payment links, wallet
// addresses, "my paypal"-style phrases) count separately from member
// flags and hit review sooner.
export const PAYMENT_FLAG_THRESHOLD = 3;

// Detection reason codes that count as payment-practice violations
// (must stay in sync with lib/evasion.ts).
export const PAYMENT_REASONS = ["payment-link", "wallet-address", "payment-phrase"];

// One flag per browser (localStorage de-dupe, same approach as /watch
// likes) keeps a single visitor from piling on.
export const FLAG_STORAGE_KEY = "aiprolice-flagged";
