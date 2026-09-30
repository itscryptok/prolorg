import Link from "next/link";
import { STATS } from "@/lib/site";

const WHY_POINTS = [
  {
    title: "Faster and cheaper than tokens",
    text: "Hiring or partnering with an individual AI expert is faster and cheaper than repeatedly buying AI tokens or hiring an expensive consulting firm.",
  },
  {
    title: "The right model for each job",
    text: "Experts know which AI model fits each part of a project — and which parts don\u2019t need AI at all.",
  },
  {
    title: "No wasted spend",
    text: "Experts control costs and keep token use lean. No burning money on trial and error.",
  },
  {
    title: "Skilled prompting, solved faster",
    text: "Expert prompting skill gets work done in hours, not weeks.",
  },
  {
    title: "Your competitive edge",
    text: "An expert partnership gives you a market advantage your competitors don\u2019t have.",
  },
  {
    title: "Talk to a human",
    text: "Real, verified experts. No bots, no guesswork.",
  },
] as const;

const CATEGORIES = [
  { title: "Forensic analysis", text: "AI-assisted forensic investigation and evidence analysis." },
  { title: "Genealogy trace", text: "Trace family lines and ancestry with expert-guided AI research." },
  { title: "Lab discovery", text: "Accelerate lab research and discovery with AI workflows." },
  { title: "Market advantage", text: "Turn AI into a market advantage with expert strategy." },
  { title: "Personal AI tutor", text: "One-on-one tutoring to master AI tools and techniques." },
  { title: "Technical project developer", text: "End-to-end development of your technical AI project." },
  { title: "Data collector & analyst", text: "Skilled collection, cleaning, and analysis of your data." },
  { title: "Other AI work", text: "Any other kind of AI work — ask an expert what\u2019s possible." },
] as const;

const CLIENT_STEPS = [
  {
    title: "Browse expert profiles",
    text: "Search by specialty, skill, and availability to find the right expert.",
  },
  {
    title: "Open the inbox",
    text: "Message the expert directly inside Prolorg — no exposed emails, no outside links.",
  },
  {
    title: "Hire through the platform",
    text: "Agree scope and price, confirm, and get the work done.",
  },
] as const;

const EXPERT_STEPS = [
  {
    title: "Create your profile",
    text: "Add your bio, specialties, portfolio, rates, and availability.",
  },
  {
    title: "Get discovered",
    text: "Clients find you by what you do best.",
  },
  {
    title: "Get hired",
    text: "Chat in the inbox, agree terms, and deliver the work.",
  },
] as const;

function StepList({ steps }: { steps: readonly { title: string; text: string }[] }) {
  return (
    <div>
      {steps.map((step, i) => (
        <div className="step" key={step.title}>
          <div className="step-num" aria-hidden="true">{i + 1}</div>
          <div className="step-body">
            <h4>{step.title}</h4>
            <p>{step.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      {/* 1. Hero */}
      <section className="hero">
        <div className="container">
          <div className="banner">
            <div className="banner-art" aria-hidden="true">
              <svg viewBox="0 0 700 700" preserveAspectRatio="xMaxYMid slice" focusable="false">
                <defs>
                  <radialGradient id="blobA" cx="38%" cy="32%" r="72%">
                    <stop offset="0%" stopColor="#ffe873" />
                    <stop offset="55%" stopColor="#ffb52e" />
                    <stop offset="100%" stopColor="#ff7b00" />
                  </radialGradient>
                  <radialGradient id="blobB" cx="42%" cy="30%" r="75%">
                    <stop offset="0%" stopColor="#fff3a0" />
                    <stop offset="50%" stopColor="#ffc93c" />
                    <stop offset="100%" stopColor="#ff9500" />
                  </radialGradient>
                  <linearGradient id="bannerWave" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#3d1478" />
                    <stop offset="100%" stopColor="#240856" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 520 C 140 470 260 570 410 535 C 540 505 620 575 700 550 L700 700 L0 700 Z"
                  fill="url(#bannerWave)"
                  opacity="0.8"
                />
                <path
                  d="M470 20 C 560 20 640 90 645 180 C 650 270 590 350 510 355 C 430 360 370 300 375 215 C 380 130 400 20 470 20 Z"
                  fill="url(#blobA)"
                />
                <path
                  d="M545 400 C 610 400 655 455 650 520 C 645 585 590 630 530 620 C 470 610 440 550 450 490 C 458 440 490 400 545 400 Z"
                  fill="url(#blobB)"
                />
                <path
                  d="M620 560 C 700 560 760 640 745 730 C 730 820 640 860 560 830 C 480 800 450 720 480 650 C 505 595 555 560 620 560 Z"
                  fill="url(#blobA)"
                />
              </svg>
            </div>
            <div className="banner-copy">
              <span className="eyebrow">THE AI EXPERT MARKETPLACE</span>
              <h1>
                Hire an expert instead. Not the AI.{" "}
                <span className="accent">
                  <a href="#why">See why.</a>
                </span>
              </h1>
              <p className="hero-sub">
                Partner with or hire a vetted AI expert for forensic work,
                genealogy traces, lab discovery, market advantage, a personal AI
                tutor, technical project development, skilled data collection and
                analysis — or any other kind of AI work.
              </p>
              <div className="banner-dots" aria-hidden="true">
                <span className="on" />
                <span />
                <span />
              </div>
              <div className="hero-ctas">
                <Link href="/experts" className="btn-banner">Browse experts</Link>
                <Link href="/join" className="btn-banner-outline">Join as an expert</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Live stats band */}
      <section className="stats-band" aria-label="Platform statistics">
        <div className="container stats-band-inner">
          <div>
            <div className="stat-num">{STATS.totalExperts}</div>
            <div className="stat-label">Total experts</div>
          </div>
          <div>
            <div className="stat-num">{STATS.newThisWeek}</div>
            <div className="stat-label">New this week</div>
          </div>
          <div>
            <div className="stat-num">{STATS.hiresCompleted}</div>
            <div className="stat-label">Hires completed</div>
          </div>
        </div>
      </section>

      {/* 3. Why Prolorg */}
      <section className="section" id="why">
        <div className="container">
          <h2 className="section-title">Why Prolorg</h2>
          <p className="section-lead">
            Hire an expert instead. Not the AI.
          </p>
          <div className="cards">
            {WHY_POINTS.map((point) => (
              <article className="card" key={point.title}>
                <h3>{point.title}</h3>
                <p>{point.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Expert categories */}
      <section className="section" id="categories" style={{ paddingTop: 0 }}>
        <div className="container">
          <h2 className="section-title">Expert categories</h2>
          <p className="section-lead">
            Whatever the AI work, there is an expert for it.
          </p>
          <div className="cards">
            {CATEGORIES.map((cat) => (
              <article className="card" key={cat.title}>
                <span className="pill">SPECIALTY</span>
                <h3>{cat.title}</h3>
                <p>{cat.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 5. How It Works */}
      <section className="section" id="how-it-works" style={{ paddingTop: 0 }}>
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <p className="section-lead">
            Clients find experts. Experts get hired. Everything happens inside
            Prolorg.
          </p>
          <div className="tracks">
            <div className="track">
              <h3>FOR CLIENTS</h3>
              <StepList steps={CLIENT_STEPS} />
              <div className="notice" role="note">
                <strong>Fair-play rule:</strong> Direct contact (email, phone)
                unlocks with a one-time fee per expert. Sharing contact details
                to dodge the fee gets your account blocked — our checks catch
                spelled-out numbers, &lsquo;at gmail dot com&rsquo; tricks, and
                other workarounds.
              </div>
            </div>
            <div className="track">
              <h3>FOR EXPERTS</h3>
              <StepList steps={EXPERT_STEPS} />
            </div>
          </div>
        </div>
      </section>

      {/* 6. About Prolorg */}
      <section className="section" id="about" style={{ paddingTop: 0 }}>
        <div className="container">
          <h2 className="section-title">About Prolorg</h2>
          <p className="section-lead" style={{ maxWidth: "72ch" }}>
            Prolorg is a talent marketplace built by Cryp Tok Solutions for the
            era of authentic connection. The best AI outcomes don&rsquo;t come
            from buying more tokens — they come from the right expert guiding
            the work. On Prolorg, clients find vetted AI experts and hire them
            through a private platform inbox: no exposed emails, no outside
            links, no guesswork.
          </p>
          <div style={{ textAlign: "center" }}>
            <Link href="/about" className="btn btn-outline">Read more</Link>
          </div>
        </div>
      </section>

      {/* 7. Final CTA band */}
      <section className="cta-band">
        <h2>You are the big deal. Let them find you.</h2>
        <Link href="/signup" className="btn btn-orange">Join Prolorg</Link>
      </section>
    </>
  );
}
