import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "How Prolorg works: clients browse AI pro profiles, open the platform inbox, and hire through Prolorg. AI pros create profiles, get discovered, and get hired. Direct contact unlocks with a one-time fee per AI pro.",
  alternates: { canonical: "/how-it-works" },
};

const CLIENT_STEPS = [
  {
    title: "Browse AI pro profiles",
    text: "Search by specialty, skill, and availability to find the right AI pro for your work.",
  },
  {
    title: "Open the inbox",
    text: "Message the AI pro directly inside Prolorg. All communication stays on the platform — no exposed emails, no outside links.",
  },
  {
    title: "Hire through the platform",
    text: "Agree scope and price, confirm the engagement, and get the work done.",
  },
] as const;

const EXPERT_STEPS = [
  {
    title: "Create your profile",
    text: "Add your bio, specialties, portfolio, rates, and availability so clients can see what you do best.",
  },
  {
    title: "Get discovered",
    text: "Clients browse and search the directory and find you by specialty, skill, and availability.",
  },
  {
    title: "Get hired",
    text: "Chat in the platform inbox, agree terms with the client, and deliver the work.",
  },
] as const;

export default function HowItWorksPage() {
  return (
    <div className="section">
      <div className="container">
        <h1 className="section-title">How It Works</h1>
        <p className="section-lead">
          Clients find AI pros. AI pros get hired. Everything happens inside
          Prolorg.
        </p>
        <div className="tracks">
          <div className="track">
            <h3>FOR CLIENTS</h3>
            {CLIENT_STEPS.map((step, i) => (
              <div className="step" key={step.title}>
                <div className="step-num" aria-hidden="true">{i + 1}</div>
                <div className="step-body">
                  <h4>{step.title}</h4>
                  <p>{step.text}</p>
                </div>
              </div>
            ))}
            <div className="notice" role="note">
              <strong>Fair-play rule:</strong> Direct contact (email, phone)
              unlocks with a one-time fee per AI pro. Sharing contact details
              to dodge the fee gets your account blocked — our checks catch
              spelled-out numbers, &lsquo;at gmail dot com&rsquo; tricks, and
              other workarounds.
            </div>
          </div>
          <div className="track">
            <h3>FOR AI PROS</h3>
            {EXPERT_STEPS.map((step, i) => (
              <div className="step" key={step.title}>
                <div className="step-num" aria-hidden="true">{i + 1}</div>
                <div className="step-body">
                  <h4>{step.title}</h4>
                  <p>{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
          <Link href="/signup" className="btn btn-orange">Get started</Link>
        </div>
      </div>
    </div>
  );
}
