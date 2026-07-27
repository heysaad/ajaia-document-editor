import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { LoginForm } from "@/features/auth/components/login-form";
import { getOptionalSessionUser } from "@/features/auth/server/auth-session";

export default async function LoginPage() {
  const viewer = await getOptionalSessionUser();

  if (viewer) {
    redirect("/");
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to your workspace"
      description="Use your verified email and password to open your private document library."
      footer={
        <>
          New to Ajai Docs?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
