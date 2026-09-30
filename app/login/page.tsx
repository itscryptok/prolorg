import type { Metadata } from "next";
import Link from "next/link";
import LogoMark from "@/components/LogoMark";

export const metadata: Metadata = {
  title: "Login",
  description: "Log in to Prolorg. Client and expert login is coming soon.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/login" },
};

export default function LoginPage() {
  return (
    <div className="stub">
      <LogoMark size={56} />
      <h1>Login</h1>
      <p>
        Client and expert login is launching soon. You&rsquo;ll be able to sign
        in with Google or your email address.
      </p>
      <Link href="/" className="btn btn-orange">Back to home</Link>
    </div>
  );
}
