import type { Metadata } from "next";
import Link from "next/link";
import LogoMark from "@/components/LogoMark";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Join Prolorg as a client or an AI pro. Registration is coming soon.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/signup" },
};

export default function SignupPage() {
  return (
    <div className="stub">
      <LogoMark size={56} />
      <h1>Join Prolorg</h1>
      <p>
        Registration is launching soon. Sign up as a client to hire AI
        AI pros, or as an AI pro to get discovered and hired through the
        platform inbox.
      </p>
      <Link href="/" className="btn btn-orange">Back to home</Link>
    </div>
  );
}
