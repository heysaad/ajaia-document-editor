"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/features/auth/client/auth-client";

type AccountCardProps = {
  name: string;
  email: string;
};

export function AccountCard({ name, email }: AccountCardProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function signOut() {
    setIsPending(true);
    setErrorMessage(null);
    const { error } = await authClient.signOut();

    if (error) {
      setErrorMessage("Could not sign out. Try again.");
      setIsPending(false);
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <Badge variant="secondary">Signed in</Badge>
        <CardTitle className="mt-3">{name}</CardTitle>
        <CardDescription>{email}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          className="w-full"
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => void signOut()}
        >
          <LogOut aria-hidden="true" />
          {isPending ? "Signing out..." : "Sign out"}
        </Button>
        {errorMessage ? (
          <p role="alert" className="text-sm text-destructive">
            {errorMessage}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
