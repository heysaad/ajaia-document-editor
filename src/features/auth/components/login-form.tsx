"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AuthFormField } from "@/features/auth/components/auth-form-field";
import { authClient } from "@/features/auth/client/auth-client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsPending(true);

    const { error } = await authClient.signIn.email({
      email,
      password,
      rememberMe: true,
    });

    if (error) {
      setErrorMessage("The email or password is incorrect.");
      setIsPending(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
      {errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Sign-in failed</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}
      <AuthFormField
        id="email"
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <AuthFormField
        id="password"
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        minLength={8}
        maxLength={128}
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <Button className="w-full" type="submit" disabled={isPending}>
        {isPending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
