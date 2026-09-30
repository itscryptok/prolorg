import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "Prolorg Terms of Use — the rules for using the AI expert marketplace, including the fair-play rule on direct contact and account suspension for evading the contact unlock fee.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <article className="legal">
      <h1>Terms of Use</h1>
      <p className="updated">Last updated: September 2026</p>

      <h2>1. Acceptance of terms</h2>
      <p>
        By accessing or using Prolorg, you agree to these Terms of Use and to
        our Privacy Policy. If you do not agree, do not use the platform.
      </p>

      <h2>2. Eligibility</h2>
      <p>
        You must be at least 18 years old to register an account on Prolorg.
      </p>

      <h2>3. Content ownership</h2>
      <p>
        You retain ownership of the content you post — your profile, portfolio,
        and messages. By posting it on Prolorg, you grant Cryp Tok Solutions a
        non-exclusive, royalty-free, worldwide license to display and
        distribute that content as part of operating the platform.
      </p>

      <h2>4. Prohibited conduct</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Post false, misleading, illegal, obscene, or IP-infringing content.</li>
        <li>Spam, harass, or abuse other users.</li>
        <li>Scrape the platform or reverse-engineer its systems.</li>
        <li>Create fake profiles or impersonate another person.</li>
        <li>
          Attempt to exchange contact details (email addresses, phone numbers,
          social handles, links, or obfuscated variations of them) to evade
          the contact unlock fee.
        </li>
      </ul>

      <h2>5. Contact unlock fee and fair play</h2>
      <p>
        Direct contact information (email, phone) may only be shared between a
        client and an expert after the one-time contact unlock fee has been
        paid for that pair. Attempting to share or solicit contact details to
        dodge the fee — including spelled-out numbers, &lsquo;at gmail dot
        com&rsquo;-style tricks, or other workarounds — is a violation of
        these terms and will result in account suspension or blocking. Prolorg
        runs automated checks on platform messages to detect such attempts.
      </p>

      <h2>6. Suspension and blocking</h2>
      <p>
        We may suspend or permanently block accounts that violate these terms,
        including accounts detected exchanging contact details to evade the
        unlock fee, without prior notice where the violation is clear.
      </p>

      <h2>7. Intellectual property</h2>
      <p>
        The Prolorg brand, logo, design, and platform software are the
        intellectual property of Cryp Tok Solutions. You may not copy,
        reproduce, or reuse them without permission.
      </p>

      <h2>8. As-is disclaimer</h2>
      <p>
        Prolorg is provided &ldquo;as is&rdquo; without warranties of any
        kind. We do not guarantee the quality, availability, or outcome of
        work arranged between clients and experts.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, Cryp Tok Solutions is not
        liable for indirect, incidental, or consequential damages arising from
        your use of the platform or from engagements between clients and
        experts.
      </p>

      <h2>10. Changes and contact</h2>
      <p>
        We may update these terms; continued use of Prolorg after changes
        means you accept them. Questions: contact us at hello@prolorg.app.
      </p>
    </article>
  );
}
