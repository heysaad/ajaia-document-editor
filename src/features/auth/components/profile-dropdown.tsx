"use client";

import { useState } from "react";
import { LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/features/auth/client/auth-client";

type ProfileDropdownProps = {
  name: string;
  email: string;
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";

  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return `${first}${second}`.toUpperCase();
}

export function ProfileDropdown({ name, email }: ProfileDropdownProps) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    const { error } = await authClient.signOut();

    if (error) {
      setIsSigningOut(false);
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  const initials = getInitials(name);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-11 gap-3 rounded-full px-2.5 pr-4 shadow-none"
        >
          <Avatar aria-hidden="true">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden text-left sm:block">
            <span className="block text-sm font-medium text-foreground">{name}</span>
            <span className="block max-w-40 truncate text-xs text-muted-foreground">
              {email}
            </span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="z-50 w-72 rounded-2xl border border-border bg-card p-2 text-card-foreground shadow-lg outline-none"
      >
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="size-11" aria-hidden="true">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
        </div>
        <DropdownMenuSeparator className="my-1 h-px bg-border" />
        <div className="px-2 py-1">
          <Badge variant="outline" className="justify-center px-3 py-1.5">
            <User className="size-3.5" aria-hidden="true" />
            Active account
          </Badge>
        </div>
        <DropdownMenuSeparator className="my-1 h-px bg-border" />
        <DropdownMenuItem
          className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-2 text-sm text-destructive outline-none focus:bg-destructive/10 focus:text-destructive"
          disabled={isSigningOut}
          onSelect={(event) => {
            event.preventDefault();
            void handleSignOut();
          }}
        >
          <LogOut className="size-4" aria-hidden="true" />
          {isSigningOut ? "Signing out..." : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
