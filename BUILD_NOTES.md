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

## Phase 2 — expert discovery (2026-09-30)

### Database: separate `prolorg` database on the existing Postgres server
- At Yemi's explicit approval (2026-09-29), Prolorg uses its own **separate
  database** (`prolorg`) on the existing paid Render Postgres server that also
  hosts REMU (`emus-db`). Same $6/mo server, $0 extra cost; REMU's database is
  untouched.
- Practical notes: Render's Postgres role owns the server, so
  `CREATE DATABASE prolorg;` works from the external connection URL with the
  dbname swapped. The `prolorg` Render web service gets `DATABASE_URL` set to
  that URL (set manually in the dashboard — never committed).
- Sandbox limitation: `npx prisma generate` cannot download engines here (the
  sandbox proxy blocks binaries.prisma.sh), so the Prisma client is generated
  at Render build time. DB access from this environment uses raw SQL via
  the token-protected `/api/init-seed` endpoint (removed after use), not the Prisma runtime.

### What shipped
- Header: play (→ /experts) + filter funnel (→ /experts#filters) icons between
  the logo and the menu, mobile + desktop, both themes (Yemi's screenshot request).
- `/experts`: server-rendered directory with keyword/specialty/max-rate/
  availability filters + 5 sort orders; shareable URLs; empty states.
- `/experts/[slug]`: public profile pages with SEO metadata, skills, rates,
  availability, reviews placeholder (fills in Phase 4).
- `/join`: expert onboarding form → POST /api/experts → creates PENDING
  profile (slug deduped). No website/email fields — contact lockdown by design.
- `prisma/migrations/0001_phase2_init/migration.sql`: hand-written initial
  migration (all tables; inbox/hire tables forward-looking for Phase 3+).
  Applied via `prisma migrate deploy` in the Render build when DATABASE_URL exists.
- Seed: `POST /api/init-seed` (token-protected, removed after use) — 8 sample experts (one per specialty),
  `isSample=true`, `status='APPROVED'`. Remove once real experts join.
- Homepage "Join as an expert" CTA now points to `/join`.
- `lib/db.ts`: null-safe lazy Prisma client — pages render empty states when
  DATABASE_URL is unset instead of crashing the build.

### Still open after Phase 2
- Live stats band still shows seeded 0s (`lib/site.ts` STATS) — wire to
  `COUNT(*) FROM "ExpertProfile" WHERE status='APPROVED'` next.
- `/login`, `/signup` remain stubs (Phase 3: auth + inbox + hiring).
- Profile "Message expert" CTA points to `/signup` until accounts exist.
