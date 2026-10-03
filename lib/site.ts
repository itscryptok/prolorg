// Prolice AI — single source of truth for brand + site constants.
export const SITE_NAME = "Prolice AI";
export const SITE_TAGLINE = "Find your AI pro.";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://aiprolice.onrender.com";
export const CONTACT_X = "https://x.com/aiprolice";
export const CONTACT_EMAIL = "support@aiprolice.com";

// Live stats band values. Phase 1: seed constants; Phase 2 wires real data.
export const STATS = {
  totalExperts: 0,
  newThisWeek: 0,
  hiresCompleted: 0,
} as const;
