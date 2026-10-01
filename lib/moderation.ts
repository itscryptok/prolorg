// Content moderation configuration.
//
// ================================================================
// YEMI — CONFIRM THIS NUMBER: how many "Flag this pro" reports
// automatically deactivate an AI pro (hiding them from /experts and
// /watch until you reactivate them in /addy)?
// ================================================================
// Current behavior: when an expert's flagCount reaches FLAG_THRESHOLD,
// the flag API sets isDeactivated = true automatically. You can always
// reactivate from the /addy "AI pros" tab. Tell me the number you want
// (and whether you want the auto-deactivation at all) and I'll adjust.
export const FLAG_THRESHOLD = 3;

// One flag per browser (localStorage de-dupe, same approach as /watch
// likes) keeps a single visitor from piling on.
export const FLAG_STORAGE_KEY = "aiprolice-flagged";
