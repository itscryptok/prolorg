import type { Metadata } from "next";
import Link from "next/link";
import LogoMark from "@/components/LogoMark";

export const metadata: Metadata = {
  title: "Find Experts",
  description: "Browse vetted AI experts on Prolorg. The expert directory is coming soon.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/experts" },
};

export default function ExpertsPage() {
  return (
    <div className="stub">
      <LogoMark size={56} />
      <h1>Find Experts</h1>
      <p>
        The expert directory is launching soon. Browse vetted AI experts by
        specialty — forensic work, genealogy traces, lab discovery, market
        advantage, personal AI tutoring, technical project development, data
        collection and analysis — and hire them through the platform inbox.
      </p>
      <Link href="/" className="btn btn-orange">Back to home</Link>
    </div>
  );
}
