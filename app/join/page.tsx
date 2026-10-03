import type { Metadata } from "next";
import JoinForm from "@/components/JoinForm";
import BackButton from "@/components/BackButton";

export const metadata: Metadata = {
  title: "Join as an AI pro",
  description:
    "Create your Prolice AI pro profile — bio, specialty, skills, rates, and availability. Get hired through the platform inbox with no bidding wars and no proposal spam.",
  alternates: { canonical: "/join" },
};

export default function JoinPage() {
  return (
    <div className="container">
      <div className="page-back"><BackButton fallback="/" /></div>
      <div className="page-head">
        <p className="eyebrow">For AI pros</p>
        <h1>Join Prolice AI as an AI pro</h1>
        <p className="section-lead" style={{ marginBottom: 0 }}>
          Tell clients what you do with AI and what it costs. Profiles are
          reviewed before they go live in the directory — AI pro accounts that
          link to your profile arrive in the next release.
        </p>
      </div>
      <JoinForm />
    </div>
  );
}
