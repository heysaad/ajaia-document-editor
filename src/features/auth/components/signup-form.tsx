"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AuthFormField } from "@/features/auth/components/auth-form-field";
import { authClient } from "@/features/auth/client/auth-client";

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsPending(true);

    const { error } = await authClient.signUp.email({
      name: name.trim(),
      email,
      password,
    });

    if (error) {
      setErrorMessage(
        error.message || "We could not create your account. Try again.",
      );
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
          <AlertTitle>Account not created</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}
      <AuthFormField
        id="name"
        label="Name"
        name="name"
        autoComplete="name"
        minLength={1}
        maxLength={120}
        required
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
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
        hint="Use 8–128 characters."
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        maxLength={128}
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <Button className="w-full" type="submit" disabled={isPending}>
        {isPending ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}
