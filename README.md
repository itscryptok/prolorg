# Prolorg

**Find your AI expert.** Prolorg is an AI expert marketplace built by Cryp Tok
Solutions: clients browse vetted AI-expert profiles and hire them through a
private platform inbox — no exposed emails, no outside links, no guesswork.

> Don&rsquo;t hire the AI. It burns your time and your token. Hire an expert.

## Phase 1 scope

Landing page (hero, live stats band, Why Prolorg, expert categories, How It
Works with client/expert tracks, About, final CTA), full About and How It
Works pages, Terms of Use, Privacy Policy, and tasteful coming-soon stubs for
`/experts`, `/login`, and `/signup`. Phase 1 needs no live database.

## Stack

- Next.js 16.3.6 + React 19.2.8 (TypeScript strict)
- Prisma 6.19.3 (schema is forward-looking for Phase 2+; no migrate in Phase 1)
- Render free sleepy web service (see `render.yaml`)

## Local dev

```bash
npm install
npm run dev
```

## Build / lint

```bash
npm run build
npm run lint
```

## Deploy notes

Push to GitHub and deploy on Render via the `render.yaml` blueprint. Set
`SITE_URL` / `NEXT_PUBLIC_SITE_URL` if you attach a custom domain. Phase 2+
will point `DATABASE_URL` at the shared paid Postgres (same pattern as REMU)
and run `npx prisma migrate deploy` in the build command.
