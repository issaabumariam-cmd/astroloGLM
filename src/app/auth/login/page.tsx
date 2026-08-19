import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Sign In",
  description: "Sign in to Astrolo to save your birth chart, chat history, and personal preferences.",
};

export default function LoginPage() {
  return <LoginForm />;
}