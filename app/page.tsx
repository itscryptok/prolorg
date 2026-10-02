import Link from "next/link";
import { STATS } from "@/lib/site";
import { getDb } from "@/lib/db";
import HeroVisual from "@/components/HeroVisual";

// Refresh the stats band every 5 minutes (ISR) — the rest of the page is static.
export const revalidate = 300;

async function getStats() {
  const db = getDb();
  if (!db) return STATS;
  try {
    // Called directly on the client (not destructured) so the method keeps
    // its `this` binding.
    const raw = (
      db as unknown as {
        $queryRawUnsafe(query: string): Promise<{ count: number }[]>;
      }
    ).$queryRawUnsafe.bind(db);
    const total = Number(
      (await raw(`SELECT COUNT(*)::int AS count FROM "ExpertProfile" WHERE status='APPROVED' AND "isDeactivated" = FALSE`))[0]?.count ?? 0
    );
    const fresh = Number(
      (
        await raw(
          `SELECT COUNT(*)::int AS count FROM "ExpertProfile" WHERE status='APPROVED' AND "isDeactivated" = FALSE AND "createdAt" >= NOW() - INTERVAL '7 days'`
        )
      )[0]?.count ?? 0
    );
    const hires = Number(
      (await raw(`SELECT COUNT(*)::int AS count FROM "HireRequest" WHERE status='COMPLETED'`))[0]?.count ?? 0
    );
    return { totalExperts: total, newThisWeek: fresh, hiresCompleted: hires };
  } catch {
    return STATS;
  }
}

const WHY_POINTS = [
  {
    title: "Faster and cheaper than tokens",
    text: "Hiring or partnering with an individual AI pro is faster and cheaper than repeatedly buying AI tokens or hiring an expensive consulting firm.",
  },
  {
    title: "The right model for each job",
    text: "AI pros know which AI model fits each part of a project — and which parts don\u2019t need AI at all.",
  },
  {
    title: "No wasted spend",
    text: "AI pros control costs and keep token use lean. No burning money on trial and error.",
  },
  {
    title: "Skilled prompting, solved faster",
    text: "AI pro prompting skill gets work done in hours, not weeks.",
  },
  {
    title: "Your competitive edge",
    text: "An AI pro partnership gives you a market advantage your competitors don\u2019t have.",
  },
  {
    title: "Talk to a human",
    text: "Real, verified AI pros. No bots, no guesswork.",
  },
] as const;

const CATEGORIES = [
  { title: "Forensic analysis", text: "AI-assisted forensic investigation and evidence analysis." },
  { title: "Genealogy trace", text: "Trace family lines and ancestry with AI pro-guided AI research." },
  { title: "Lab discovery", text: "Accelerate lab research and discovery with AI workflows." },
  { title: "Market advantage", text: "Turn AI into a market advantage with AI pro strategy." },
  { title: "Personal AI tutor", text: "One-on-one tutoring to master AI tools and techniques." },
  { title: "Technical project developer", text: "End-to-end development of your technical AI project." },
  { title: "Data collector & analyst", text: "Skilled collection, cleaning, and analysis of your data." },
  { title: "Other AI work", text: "Any other kind of AI work — ask an AI pro what\u2019s possible." },
] as const;

const CLIENT_STEPS = [
  {
    title: "Browse AI pro profiles",
    text: "Search by specialty, skill, and availability to find the right AI pro.",
  },
  {
    title: "Open the inbox",
    text: "Message the AI pro directly inside AiProlice — no exposed emails, no outside links.",
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

export default async function HomePage() {
  const stats = await getStats();
  return (
    <>
      {/* 1. Hero */}
      <section className="hero hero-split">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">THE AI PRO MARKETPLACE</span>
            <h1>
              Hire an AI pro. Not the AI.{" "}
              <span className="accent">
                <a href="#why">Here's why.</a>
              </span>
            </h1>
            <p className="hero-sub">
              Partner with an AI pro for forensics, genealogy traces, lab
              discovery, market advantage, personal AI tutoring, technical
              projects, data analysis — or any other AI work.
            </p>
            <div className="hero-ctas">
              <Link href="/experts" className="btn btn-orange">Browse AI pros</Link>
              <Link href="/join" className="btn btn-outline">Join as an AI pro</Link>
            </div>
          </div>
          <HeroVisual />
        </div>
      </section>

      {/* 2. Live stats band */}
      <section className="stats-band" aria-label="Platform statistics">
        <div className="container stats-band-inner">
          <div>
            <div className="stat-num">{stats.totalExperts}</div>
            <div className="stat-label">Total AI pros</div>
          </div>
          <div>
            <div className="stat-num">{stats.newThisWeek}</div>
            <div className="stat-label">New this week</div>
          </div>
          <div>
            <div className="stat-num">{stats.hiresCompleted}</div>
            <div className="stat-label">Hires completed</div>
          </div>
        </div>
      </section>

      {/* 3. Why AiProlice */}
      <section className="section" id="why">
        <div className="container">
          <h2 className="section-title">Why AiProlice</h2>
          <p className="section-lead">
            Hire an AI pro. Not the AI.
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

      {/* 4. AI pro categories */}
      <section className="section" id="categories" style={{ paddingTop: 0 }}>
        <div className="container">
          <h2 className="section-title">AI pro categories</h2>
          <p className="section-lead">
            Whatever the AI work, there is an AI pro for it.
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
            Clients find AI pros. AI pros get hired. Everything happens inside
            AiProlice.
          </p>
          <div className="tracks">
            <div className="track">
              <h3>FOR CLIENTS</h3>
              <StepList steps={CLIENT_STEPS} />
              <div className="notice" role="note">
                <strong>Fair-play rule:</strong> Direct contact (email, phone)
                unlocks with a one-time fee per client/AI pro pair — either
                side can pay, and payment from either side unlocks the pair.
                Sharing contact details to dodge the fee gets your account
                blocked — our checks catch spelled-out numbers, &lsquo;at gmail
                dot com&rsquo; tricks, and other workarounds.
              </div>
            </div>
            <div className="track">
              <h3>FOR AI PROS</h3>
              <StepList steps={EXPERT_STEPS} />
            </div>
          </div>
        </div>
      </section>

      {/* 6. About AiProlice */}
      <section className="section" id="about" style={{ paddingTop: 0 }}>
        <div className="container">
          <h2 className="section-title">About AiProlice</h2>
          <p className="section-lead" style={{ maxWidth: "72ch" }}>
            AiProlice is a talent marketplace built by Cryp Tok Solutions for the
            era of authentic connection. The best AI outcomes don&rsquo;t come
            from buying more tokens — they come from the right AI pro guiding
            the work. On AiProlice, clients find AI pros and hire them
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
        <h2>You are the big deal. Let clients find you.</h2>
        <Link href="/signup" className="btn btn-orange">Join AiProlice</Link>
      </section>
    </>
  );
}
