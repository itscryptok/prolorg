# BUILD_NOTES.md — Prolorg Phase 1

## Stubbed / faked
- **Live stats band** (`Total experts` / `New this week` / `Hires completed`):
  seeded to 0 via `lib/site.ts` STATS constants, per spec. Phase 2 wires real data.
- **`/experts`, `/login`, `/signup`**: tasteful on-brand coming-soon stubs
  (no-indexed, excluded from sitemap and robots crawl rules). Real directory,
  auth, and onboarding land in Phase 2/3.
- **Database**: `prisma/schema.prisma` models User, ExpertProfile,
  Conversation, Message, HireRequest, Review, ContactUnlock with relations
  wired. `prisma generate` runs in build; no migration is created or applied
  in Phase 1 (no DB provisioned yet). `HireRequest.price` is an Int (smallest
  currency unit); `ContactUnlock.amountCents` likewise.
- **Contact-evasion detection**: rules and messaging UI are Phase 4 work. The
  fair-play warning copy and Terms §5 describe the intended behavior.

## Assets
- `favicon.svg` and `public/hero-glow.svg`: hand-written crisp SVGs.
- `apple-touch-icon.png` (180×180) and `og-image.png` (1200×630): rasterized
  with Python PIL (shield + P drawn programmatically) — no ImageMagick/rsvg
  needed. Crisp but simple; a designer pass can polish later.

## Brand deviations from the reference (intentional, per spec)
- Tagline is "Find your AI expert." (marketplace positioning), not the
  reference site's "Find co-founders. Find Talents."
- No video swipe feed in Phase 1 — the reference's feed concept maps to the
  expert directory in Phase 2.
- Blue logo mark uses #1e3a8a (spec's "deep blue (#1e3a8a-ish)").

## Environment workarounds (2026-09-29)
- **npm registry unreachable**: `npm install` failed repeatedly with
  ECONNRESET through the egress proxy (registry.npmjs.org resets TLS for
  npm; curl works). `node_modules/` was seeded by copying
  `~/workspace/emus/node_modules` — the dependency sets are byte-identical
  (package.json modeled exactly on emus's: next 16.3.6, react 19.2.8,
  prisma 6.19.3, etc.). No package-lock.json exists yet; run `npm install`
  on a network with registry access to generate one before `npm ci` on
  Render (or Render's own network will handle it).
- **`prisma generate` engine download blocked**: the CLI tried to fetch
  `schema-engine` from binaries.prisma.sh (also proxy-blocked) and crashed
  on the uncaught network error. Workaround: pointed
  `PRISMA_SCHEMA_ENGINE_BINARY` at the already-cached binary in
  `~/.cache/prisma/master/c2990dca.../debian-openssl-3.0.x/schema-engine`.
  Generate succeeded (Prisma Client v6.19.3).

## Next.js 16 notes
- Async request APIs (params/searchParams) are not used — no dynamic routes
  in Phase 1.
- `next lint` is removed in v16; the `lint` script uses the `eslint` CLI
  directly (same as emus).
- Turbopack is the default builder; no webpack config present.

## Unsure about
- `HireRequest.price` currency/unit and the contact unlock fee amount —
  product decisions for Phase 4 (needs Yemi's call on who pays: client per
  expert, expert per client, or either side).
- Payment provider for the unlock fee (likely Stripe — needs Yemi's own
  account setup via browser).
