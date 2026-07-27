import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { SignupForm } from "@/features/auth/components/signup-form";
import { getOptionalSessionUser } from "@/features/auth/server/auth-session";

export default async function SignupPage() {
  const viewer = await getOptionalSessionUser();

  if (viewer) {
    redirect("/");
  }

  return (
    <AuthShell
      eyebrow="Create account"
      title="Start a secure workspace"
      description="Create an account with your email and password to start your private document workspace."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthShell>
  );
}
