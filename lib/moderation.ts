// Content moderation configuration.
//
// ================================================================
// YEMI'S SETTINGS (confirmed 2026-09-30):
// - FLAG_THRESHOLD = 7
// - NO auto-deactivation: reaching the threshold only highlights the
//   pro in /addy ("needs your review"). A human (Yemi) decides whether
//   to deactivate, from the /addy "AI pros" tab.
// - Flag counts are NEVER public: they appear only in /addy. Public
//   pro cards and /watch videos show the "Flag this pro" button with
//   no counts.
// ================================================================
export const FLAG_THRESHOLD = 7;

// One flag per browser (localStorage de-dupe, same approach as /watch
// likes) keeps a single visitor from piling on.
export const FLAG_STORAGE_KEY = "aiprolice-flagged";
