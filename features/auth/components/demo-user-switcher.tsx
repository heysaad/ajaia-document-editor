"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetchJson } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type DemoUserOption = {
  id: string;
  name: string;
  email: string;
};

type DemoUserSwitcherProps = {
  users: DemoUserOption[];
  selectedUserId: string | null;
  onUserChanged?: (userId: string) => void;
};

export function DemoUserSwitcher({
  users,
  selectedUserId,
  onUserChanged,
}: DemoUserSwitcherProps) {
  const router = useRouter();
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSelectUser(userId: string) {
    setPendingUserId(userId);
    setErrorMessage(null);

    try {
      await fetchJson("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      onUserChanged?.(userId);

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not switch demo users.",
      );
    } finally {
      setPendingUserId(null);
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <Badge variant="warning">Demo identity</Badge>
            <CardTitle className="mt-3">Reviewer switcher</CardTitle>
          </div>
        </div>
        <CardDescription>
          This stays clearly separate from production auth and makes user
          ownership easy to verify.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {users.map((user) => {
          const isSelected = user.id === selectedUserId;

          return (
            <Button
              key={user.id}
              type="button"
              variant={isSelected ? "secondary" : "outline"}
              className={cn(
                "h-auto w-full items-start justify-between rounded-2xl px-4 py-4 text-left",
                isSelected && "border-primary/25 bg-primary/10 text-foreground",
              )}
              aria-pressed={isSelected}
              disabled={pendingUserId !== null}
              onClick={() => void handleSelectUser(user.id)}
            >
              <span className="space-y-1">
                <span className="block text-sm font-semibold text-foreground">
                  {user.name}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {user.email}
                </span>
              </span>
              {isSelected ? (
                <CheckCircle2
                  className="mt-0.5 text-primary"
                  aria-hidden="true"
                />
              ) : null}
            </Button>
          );
        })}
        {errorMessage ? (
          <p role="alert" className="text-sm text-destructive">
            {errorMessage}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
