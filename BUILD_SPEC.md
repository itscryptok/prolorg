# Prolorg — Phase 1 Build Spec

## 0. Non-negotiable first step
This project uses **Next.js 16.3.6 + React 19.2.8** — this is NOT the Next.js from training data.
Before writing ANY code, read the relevant guides in `~/workspace/emus/node_modules/next/dist/docs/`
(resolved from that directory). Heed every deprecation notice. If in doubt, copy the patterns used in
`~/workspace/emus/app/` (layout.tsx, page.tsx, globals.css, robots.ts, sitemap.ts) — that app builds
and deploys cleanly on this exact stack.

## 1. Project
- Location: `~/workspace/prolorg/` (create it; this spec file lives at its root)
- `npm init` equivalent: package.json modeled EXACTLY on `~/workspace/emus/package.json`
  (name "prolorg", same deps: next 16.3.6, react 19.2.8, @prisma/client + prisma 6.19.3,
  bcryptjs, typescript, eslint-config-next 16.3.6, tsx). No extra dependencies.
- TypeScript strict, ESLint clean, `npm run build` must pass with zero errors/warnings treated as failures.

## 2. Brand (from the reference site — match it)
- Name: **Prolorg**. Tagline: "Find your AI expert."
- Colors: near-black background (#0a0a0a), white bold headlines (#ffffff), gray secondary text (#a1a1a1),
  orange/amber accents (#FFA500 for CTAs, wordmark, stats, pill tags), deep blue (#1e3a8a-ish) for the logo mark.
- Logo: simple geometric shield emblem in blue with a "P" cut/overlay in orange — draw as inline SVG
  (create `components/LogoMark.tsx`, reusable in header + footer).
- Style: large bold sans-serif headlines, rounded pill buttons, minimal rounded cards, generous spacing,
  mobile-app feel. Fully responsive + accessible (semantic landmarks, alt text, focus states,
  color contrast, keyboard-navigable menu).

## 3. Pages (Phase 1 scope)
### 3a. Splash screen
Client component shown on first load (~1.2s or until page ready): black background, centered logo,
"Prolorg" in orange, tagline "Find your AI expert.", thin orange progress bar animating.
Then reveals the site. (Reference site has this — replicate the feel, not a copy.)

### 3b. Landing page `/` — sections in order
1. **Header** (sticky): LogoMark + "Prolorg" left; nav center/right: Find Experts, How It Works, About,
   Login; orange "Sign Up" pill button; hamburger menu on mobile with slide-out panel.
2. **Hero**: eyebrow "THE AI EXPERT MARKETPLACE"; H1: "Don't hire the AI. It burns your time and your
   token. Hire an expert."; subhead: "Partner with or hire a vetted AI expert for forensic work,
   genealogy traces, lab discovery, market advantage, a personal AI tutor, technical project
   development, skilled data collection and analysis — or any other kind of AI work.";
   CTAs: orange pill "Browse experts" (/experts) + outline pill "Join as an expert" (/signup);
   hero visual: abstract orange/blue glow panel or shield motif (CSS/SVG, no external images).
3. **Live stats band**: "Total experts" / "New this week" / "Hires completed" — values from
   `lib/site.ts` constants (seed 0; Phase 2 wires real data). Orange numerals.
4. **Why Prolorg** (his six points, as cards):
   - Faster and cheaper than tokens — "Hiring or partnering with an individual AI expert is faster and cheaper than repeatedly buying AI tokens or hiring an expensive consulting firm."
   - The right model for each job — "Experts know which AI model fits each part of a project — and which parts don't need AI at all."
   - No wasted spend — "Experts control costs and keep token use lean. No burning money on trial and error."
   - Skilled prompting, solved faster — "Expert prompting skill gets work done in hours, not weeks."
   - Your competitive edge — "An expert partnership gives you a market advantage your competitors don't have."
   - Talk to a human — "Real, verified experts. No bots, no guesswork."
5. **Expert categories** grid (8 cards): Forensic analysis / Genealogy trace / Lab discovery /
   Market advantage / Personal AI tutor / Technical project developer / Data collector & analyst /
   Other AI work. Each with one-line description.
6. **How It Works** — two tracks side by side:
   - FOR CLIENTS: 1 "Browse expert profiles" (search by specialty, skill, availability);
     2 "Open the inbox" (message the expert directly inside Prolorg);
     3 "Hire through the platform" (agree scope and price, confirm, get the work done).
     Notice box: "Direct contact (email, phone) unlocks with a one-time fee per
     client/AI pro pair — either side can pay, and payment from either side unlocks
     the pair. (Fee amount TBD by Yemi; Stripe not yet connected.) Sharing contact
     details to dodge the fee gets your account blocked — our checks catch
     spelled-out numbers, 'at gmail dot com' tricks, and other workarounds."
   - FOR EXPERTS: 1 "Create your profile" (bio, specialties, portfolio, rates, availability);
     2 "Get discovered" (clients find you by what you do best); 3 "Get hired" (chat, agree terms, deliver).
7. **About Prolorg**: "Prolorg is a talent marketplace built by Cryp Tok Solutions for the era of
   authentic connection. The best AI outcomes don't come from buying more tokens — they come from the
   right expert guiding the work. On Prolorg, clients find vetted AI experts and hire them through a
   private platform inbox: no exposed emails, no outside links, no guesswork."
8. **Final CTA band**: "You are the big deal. Let them find you." + orange "Join Prolorg" button.
9. **Footer**: "Product of Cryp Tok Solutions 2026" (Cryp Tok Solutions in orange); "© 2026 Cryp Tok
   Solutions"; X icon link https://x.com/prolorg; mail icon link hello@prolorg.app; nav links:
   Home, Find Experts, How It Works, About, Login, Sign Up, Terms of Use, Privacy Policy.

### 3c. `/about` — full About page (expands section 7: mission, the token-burning problem, the expert answer, built by Cryp Tok Solutions).
### 3d. `/how-it-works` — full How It Works page (expands section 6, both tracks + the contact-fee/blocking notice).
### 3e. `/terms` — Terms of Use (adapt the reference's 10 sections: acceptance; 18+ to register; content
ownership — user keeps ownership, grants Cryp Tok Solutions a non-exclusive royalty-free worldwide license;
prohibited conduct — false content, illegal/obscene/IP-infringing material, spam/harassment, scraping,
fake profiles, AND attempting to exchange contact details to evade the unlock fee; suspension rights;
IP belongs to Cryp Tok Solutions; as-is disclaimer; liability limitation; changes; contact).
Last updated: September 2026.
### 3f. `/privacy` — Privacy Policy (operated by Cryp Tok Solutions; collects account info, profile info,
messages, usage data; profiles are visible to anyone including guests; inbox contents private to
participants + admins for safety review; auth via Google/email; user rights: access, correct, delete;
contact hello@prolorg.app). Last updated: September 2026.
### 3g. Stubs (tasteful "coming soon" page, on-brand): `/experts`, `/login`, `/signup`.
Nav "Find Experts" -> /experts, "Login" -> /login, "Sign Up"/"Join as an expert" -> /signup.

## 4. SEO + site baseline (EVERY item, like REMU)
- `lib/site.ts`: SITE_NAME "Prolorg", SITE_TAGLINE, SITE_URL "https://prolorg.onrender.com",
  CONTACT_X, CONTACT_EMAIL, STATS constants.
- layout.tsx metadata: keyword-rich description worded to match the H1
  (mention: hire AI expert, AI expert marketplace, forensic AI, genealogy trace, AI tutor,
  data analyst — never promise more than the page says); keywords array; canonical;
  icons: /favicon.svg + /apple-touch-icon.png; OG + Twitter cards with /og-image.png;
  robots index/follow; themeColor #0a0a0a.
- JSON-LD: Organization (Cryp Tok Solutions / Prolorg) + WebSite.
- `app/robots.ts`, `app/sitemap.ts` (home, about, how-it-works, terms, privacy).
- `public/favicon.svg` (orange P shield), `public/apple-touch-icon.png` (180x180),
  `public/og-image.png` (1200x630). Check the VM for `convert`/`rsvg-convert`/Python PIL —
  use whatever exists to rasterize from SVG; if nothing exists, ship crisp SVGs and note it.
- Preload the hero visual. `<html lang="en">`.

## 5. Database (forward-looking, zero Phase-1 runtime cost)
- `prisma/schema.prisma` (PostgreSQL): models User(id, email unique, name, role [client|expert|admin],
  passwordHash?, createdAt), ExpertProfile(id, userId unique, headline, bio, city, country,
  specialties String[], portfolio Json, hourlyRate?, availability, ratingAvg, createdAt),
  Conversation(id, clientId, expertId, unlockedContact Boolean default false, createdAt),
  Message(id, conversationId, senderId, body, flagged Boolean default false, createdAt),
  HireRequest(id, conversationId, scope, price, status, createdAt),
  Review(id, hireRequestId, rating, comment, createdAt), ContactUnlock(id, conversationId,
  paidById, amountCents, createdAt). Relations wired properly.
- `npx prisma generate` must succeed. NO migrate in build (DB gets wired in Phase 2+).

## 6. Deploy config
- `render.yaml`: single web service, name `prolorg`, runtime node, plan `free`,
  `buildCommand: npm ci && npx prisma generate && npm run build`,
  `startCommand: npm start`, `healthCheckPath: /`,
  envVars: NODE_VERSION "24", SITE_URL + NEXT_PUBLIC_SITE_URL = https://prolorg.onrender.com.
  NO databases block (Phase 1 needs no DB; the paid shared DB gets wired in Phase 2).
- `README.md`: what Prolorg is, stack, local dev (`npm i`, `npm run dev`), deploy notes.

## 7. Definition of done
- `npm run build` passes clean; `npm run lint` clean.
- Every page in §3 renders; no dead nav links (stubs where noted).
- Responsive at 360px / 768px / 1280px; keyboard + screen-reader sane.
- Leave a `BUILD_NOTES.md` listing anything you stubbed, faked, or were unsure about.
- Do NOT commit node_modules. Do NOT invent features beyond this spec.
