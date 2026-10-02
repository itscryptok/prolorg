import type { Metadata } from "next";
import Link from "next/link";
import BackButton from "@/components/BackButton";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "How AiProlice works: clients browse AI pro profiles, open the platform inbox, and hire through AiProlice. AI pros create profiles, get discovered, and get hired. Direct contact unlocks with a one-time fee per client/AI pro pair, payable by either side.",
  alternates: { canonical: "/how-it-works" },
};

const CLIENT_STEPS = [
  {
    title: "Browse AI pro profiles",
    text: "Search by specialty, skill, and availability to find the right AI pro for your work.",
  },
  {
    title: "Open the inbox",
    text: "Message the AI pro directly inside AiProlice. All communication stays on the platform — no exposed emails, no outside links. You can discuss payment here, but never share payment details in the chat.",
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
        <div className="page-back"><BackButton fallback="/" /></div>
        <h1 className="section-title">How It Works</h1>
        <p className="section-lead">
          Clients find AI pros. AI pros get hired. Everything happens inside
          AiProlice.
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
              unlocks with a one-time fee per client/AI pro pair — either
              side can pay, and payment from either side unlocks the pair.
              Sharing contact details to dodge the fee gets your account
              blocked — our checks catch spelled-out numbers, &lsquo;at gmail
              dot com&rsquo; tricks, and other workarounds.
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
        <section className="safety-section" aria-labelledby="payment-safety">
          <h2 id="payment-safety" className="section-title" style={{ fontSize: "1.6rem" }}>
            Payment safety
          </h2>
          <p className="section-lead" style={{ textAlign: "left", margin: "0 0 1rem" }}>
            Talking about payment is fine in the inbox. Exchanging payment
            details is not.
          </p>
          <div className="notice" role="note">
            <strong>The rule:</strong> never type card numbers, bank account
            details, wallet addresses, or payment links into the chat. Our
            automated checks flag them, and violators will be banned.
          </div>
          <ol className="safety-steps">
            <li>
              <strong>Agree the work and the price</strong> in the AiProlice
              inbox — discussing payment here is allowed and encouraged.
            </li>
            <li>
              <strong>Pay as work is delivered</strong> — clients, hold your
              payment until the work actually lands. Experts, agree on an
              incremental delivery schedule with your client before starting,
              and collect payment at every stage as each one is delivered.
            </li>
            <li>
              <strong>Unlock direct contact</strong> — either side pays a
              one-time $1.50 fee, which unlocks contact exchange for your
              client/AI pro pair only.
            </li>
            <li>
              <strong>Exchange payment details outside the app</strong> — only
              after unlocking. AiProlice never sees or handles your payment
              details, so keep them out of the chat entirely.
            </li>
          </ol>
        </section>

        <section className="safety-section" aria-labelledby="beware-scams">
          <h2 id="beware-scams" className="section-title" style={{ fontSize: "1.6rem" }}>
            Beware of scams
          </h2>
          <p className="section-lead" style={{ textAlign: "left", margin: "0 0 1rem" }}>
            Most scams follow the same playbook. Watch for these red flags:
          </p>
          <ul className="scam-list">
            <li>
              <strong>Upfront fees to start or apply</strong> — a real client
              never asks you to pay to begin work, and a real pro never asks
              for money before terms are agreed.
            </li>
            <li>
              <strong>Full payment demanded before any work exists</strong> —
              a stranger asking for the entire fee up front, with no
              deliverable on the table, is a classic setup. Tie payments to
              milestones instead.
            </li>
            <li>
              <strong>Rushed off the app</strong> — anyone pushing you to move
              to WhatsApp, Telegram, or another channel <em>before</em> the $1
              contact unlock is dodging our safety checks.
            </li>
            <li>
              <strong>Payment links and off-app payment demands</strong> —
              treat unexpected payment links with suspicion, and never enter
              card or bank details anywhere except a payment page you trust.
            </li>
            <li>
              <strong>Too good to be true</strong> — overpayment, instant riches,
              or a &ldquo;perfect&rdquo; profile with no history are classic
              warning signs.
            </li>
            <li>
              <strong>Requests for sensitive data</strong> — never share ID
              documents, Social Security numbers, bank logins, or passwords in
              the chat. AiProlice will never ask for your password or payment
              details by email.
            </li>
          </ul>
          <div className="notice" role="note">
            <strong>See something suspicious?</strong> Use the{" "}
            <strong>Flag</strong> button on the pro&apos;s profile, or{" "}
            <Link href="/report-issue">report an issue</Link> — our team
            reviews every report.
          </div>
        </section>

        <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
          <Link href="/signup" className="btn btn-orange">Get started</Link>
        </div>
      </div>
    </div>
  );
}
