// Prolorg AI pro-domain constants shared by the directory, profiles, filters,
// onboarding form, and seed script.

export const SPECIALTIES = [
  "Forensic analysis",
  "Genealogy trace",
  "Lab discovery",
  "Market advantage",
  "Personal AI tutor",
  "Technical project developer",
  "Data collector & analyst",
  "Other AI work",
] as const;

export type Specialty = (typeof SPECIALTIES)[number];

export const AVAILABILITY_OPTIONS = [
  "Available now",
  "Within 1 week",
  "Within 2 weeks",
  "Within 1 month",
  "Booked — waitlist",
] as const;

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export function formatRate(hourlyRate: number | null, projectRate: number | null): string {
  if (hourlyRate != null && projectRate != null) return `$${hourlyRate}/hr · from $${projectRate}`;
  if (hourlyRate != null) return `$${hourlyRate}/hr`;
  if (projectRate != null) return `From $${projectRate}`;
  return "Rate on request";
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// Deterministic avatar hue per AI pro (used for the initials avatar).
export function avatarHue(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return h;
}
