import { SignupForm } from "@/components/auth/signup-form";

export const metadata = {
  title: "Create Account",
  description: "Join Astrolo for free. Save your birth chart, chat with the AI advisor, and track your cosmic journey.",
};

export default function SignupPage() {
  return <SignupForm />;
}