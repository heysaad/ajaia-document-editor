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
  variant?: "card" | "inline";
};

export function AccountCard({
  name,
  email,
  variant = "card",
}: AccountCardProps) {
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

  if (variant === "inline") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/95 px-4 py-3 shadow-[0_18px_60px_-28px_rgba(49,46,129,0.22)]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Signed in</Badge>
            <p className="text-sm font-semibold text-foreground">{name}</p>
          </div>
          <p className="mt-1 truncate text-sm text-muted-foreground">{email}</p>
        </div>
        <div className="flex items-center gap-3">
          {errorMessage ? (
            <p role="alert" className="text-sm text-destructive">
              {errorMessage}
            </p>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => void signOut()}
          >
            <LogOut aria-hidden="true" />
            {isPending ? "Signing out..." : "Sign out"}
          </Button>
        </div>
      </div>
    );
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
