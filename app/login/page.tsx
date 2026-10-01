import type { Metadata } from "next";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Login",
  description: "Log in to AiProlice to message AI pros, manage hires, and leave reviews.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/login" },
};

export default function LoginPage() {
  return <LoginForm />;
}
