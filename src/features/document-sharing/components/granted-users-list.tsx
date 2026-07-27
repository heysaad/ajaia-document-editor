"use client";

import { LoaderCircle } from "lucide-react";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { DocumentShareSummary } from "@/features/document-sharing/models";

type GrantedUsersListProps = {
  shares: DocumentShareSummary[];
  isLoading: boolean;
  isRevokingUserId: string | null;
  onRevoke: (share: DocumentShareSummary) => Promise<boolean>;
};

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function GrantedUsersList({
  shares,
  isLoading,
  isRevokingUserId,
  onRevoke,
}: GrantedUsersListProps) {
  const [revokeCandidate, setRevokeCandidate] =
    useState<DocumentShareSummary | null>(null);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground">
        People with access
      </h3>

      {isLoading ? (
        <div
          className="flex items-center gap-2 py-2 text-sm text-muted-foreground"
          role="status"
        >
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          Loading people...
        </div>
      ) : shares.length === 0 ? (
        <p className="py-2 text-sm text-muted-foreground">
          No shared editors yet.
        </p>
      ) : (
        <ul className="divide-y divide-border/70">
          {shares.map((share) => (
            <li
              key={share.user.id}
              className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              <Avatar className="size-9">
                <AvatarFallback>{getInitials(share.user.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {share.user.name}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {share.user.email}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                disabled={isRevokingUserId === share.user.id}
                onClick={() => setRevokeCandidate(share)}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}

      <AlertDialog
        open={Boolean(revokeCandidate)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !isRevokingUserId) {
            setRevokeCandidate(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove access?</AlertDialogTitle>
            <AlertDialogDescription>
              {revokeCandidate
                ? `${revokeCandidate.user.name} will no longer be able to open or edit this document.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(isRevokingUserId)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={Boolean(isRevokingUserId)}
              onClick={(event) => {
                event.preventDefault();
                if (!revokeCandidate) {
                  return;
                }

                void onRevoke(revokeCandidate).then((removed) => {
                  if (removed) {
                    setRevokeCandidate(null);
                  }
                });
              }}
            >
              {isRevokingUserId ? "Removing..." : "Remove access"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
