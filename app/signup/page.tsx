import type { Metadata } from "next";
import SignupForm from "@/components/SignupForm";

export const metadata: Metadata = {
  title: "Sign Up",
  description:
    "Join AiProlice as a client to hire AI pros, or as an AI pro to get discovered and hired through the platform inbox.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/signup" },
};

export default function SignupPage() {
  return <SignupForm />;
}
