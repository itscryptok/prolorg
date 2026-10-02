import type { Metadata } from "next";
import BackButton from "@/components/BackButton";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "AiProlice Privacy Policy — what we collect (account info, profiles, messages, usage data), who can see it, and your rights to access, correct, or delete your data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <article className="legal">
      <div className="page-back"><BackButton fallback="/" /></div>
      <h1>Privacy Policy</h1>
      <p className="updated">Last updated: September 2026</p>

      <h2>Who operates AiProlice</h2>
      <p>
        AiProlice is operated by Cryp Tok Solutions. Contact:
        support@aiprolice.com.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>Account information: name, email address, password (stored hashed).</li>
        <li>Profile information: bio, specialties, portfolio, rates, availability, city and country.</li>
        <li>Messages sent through the platform inbox.</li>
        <li>Usage data: pages visited, searches performed, and basic device information.</li>
      </ul>

      <h2>Who can see your data</h2>
      <p>
        AI pro profiles are visible to anyone, including guests who are not
        signed in. Inbox message contents are private to the participants and
        to AiProlice administrators for safety review (including detecting
        attempts to exchange contact details to evade the unlock fee).
      </p>

      <h2>Authentication</h2>
      <p>
        You can sign in with Google or with an email address and password.
      </p>

      <h2>Your rights</h2>
      <p>
        You may request access to, correction of, or deletion of your personal
        data at any time by contacting support@aiprolice.com. You may also
        withdraw consent for data processing, subject to legal and
        contractual limits.
      </p>

      <h2>Data retention and security</h2>
      <p>
        We keep your data only as long as needed to operate the platform and
        meet legal obligations, and we protect it with industry-standard
        security measures, including hashed passwords and encrypted
        connections.
      </p>

      <h2>Changes</h2>
      <p>
        We may update this policy; material changes will be announced on the
        platform. Continued use after changes means you accept the updated
        policy.
      </p>
    </article>
  );
}
