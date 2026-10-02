import type { Metadata } from "next";
import Link from "next/link";
import BackButton from "@/components/BackButton";

export const metadata: Metadata = {
  title: "About AiProlice",
  description:
    "About AiProlice — the AI pro marketplace by Cryp Tok Solutions. Why hiring an AI pro beats burning time and tokens, and how clients hire AI pros through a private platform inbox.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <article className="legal">
      <div className="page-back"><BackButton fallback="/" /></div>
      <h1>About AiProlice</h1>
      <p className="updated">The AI pro marketplace by Cryp Tok Solutions.</p>

      <h2>Our mission</h2>
      <p>
        AiProlice is a talent marketplace built by Cryp Tok Solutions for the era
        of authentic connection. We believe the best AI outcomes don&rsquo;t
        come from buying more tokens — they come from the right AI pro guiding
        the work.
      </p>

      <h2>The token-burning problem</h2>
      <p>
        Hiring the AI directly burns your time and your token. Repeatedly
        buying AI tokens, guessing at prompts, and paying expensive consulting
        firms adds up — while the work still comes back half-done. Most people
        don&rsquo;t need more tokens. They need someone who already knows how
        to get the result.
      </p>

      <h2>The AI pro answer</h2>
      <p>
        On AiProlice, clients find AI pros — for forensic work,
        genealogy traces, lab discovery, market advantage, personal AI
        tutoring, technical project development, skilled data collection and
        analysis, or any other kind of AI work — and hire them through a
        private platform inbox. No exposed emails. No outside links. No
        guesswork.
      </p>
      <p>
        AI pros know which AI model fits each part of a project — and which
        parts don&rsquo;t need AI at all. They control costs, keep token use
        lean, and solve in hours what takes others weeks. That partnership is
        a market advantage competitors can&rsquo;t copy.
      </p>

      <h2>Built by Cryp Tok Solutions</h2>
      <p>
        AiProlice is a product of Cryp Tok Solutions, built for the era of
        authentic connection: real, verified AI pros, talking to real clients,
        doing real work.
      </p>

      <p style={{ marginTop: "2.5rem" }}>
        <Link href="/signup" className="btn btn-orange">Join AiProlice</Link>
      </p>
    </article>
  );
}
