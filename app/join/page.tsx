import type { Metadata } from "next";
import JoinForm from "@/components/JoinForm";

export const metadata: Metadata = {
  title: "Join as an Expert",
  description:
    "Create your Prolorg expert profile — bio, specialty, skills, rates, and availability. Get hired through the platform inbox with no bidding wars and no proposal spam.",
  alternates: { canonical: "/join" },
};

export default function JoinPage() {
  return (
    <div className="container">
      <div className="page-head">
        <p className="eyebrow">For experts</p>
        <h1>Join Prolorg as an expert</h1>
        <p className="section-lead" style={{ marginBottom: 0 }}>
          Tell clients what you do with AI and what it costs. Profiles are
          reviewed before they go live in the directory — expert accounts that
          link to your profile arrive in the next release.
        </p>
      </div>
      <JoinForm />
    </div>
  );
}
