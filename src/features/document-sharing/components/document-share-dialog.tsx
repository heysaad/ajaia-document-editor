"use client";

import { LoaderCircle, Search, UserMinus, UserPlus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  type DocumentShareSummary,
  type EligibleShareUsersResult,
  type GrantDocumentShareResult,
  type DocumentShareListResult,
  type ShareTargetRecord,
} from "@/features/document-sharing/models";
import { fetchJson } from "@/lib/api-client";

type DocumentShareDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentTitle: string;
};

function sortUsers<T extends { name: string; email: string }>(items: T[]) {
  return [...items].sort(
    (left, right) =>
      left.name.localeCompare(right.name) || left.email.localeCompare(right.email),
  );
}

function sortShares(items: DocumentShareSummary[]) {
  return [...items].sort(
    (left, right) =>
      left.user.name.localeCompare(right.user.name) ||
      left.user.email.localeCompare(right.user.email),
  );
}

function matchesQuery(
  item: { name: string; email: string },
  query: string,
) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  return (
    item.name.toLowerCase().includes(normalizedQuery) ||
    item.email.toLowerCase().includes(normalizedQuery)
  );
}

export function DocumentShareDialog({
  open,
  onOpenChange,
  documentId,
  documentTitle,
}: DocumentShareDialogProps) {
  const [query, setQuery] = useState("");
  const [shares, setShares] = useState<DocumentShareSummary[]>([]);
  const [eligibleUsers, setEligibleUsers] = useState<ShareTargetRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isGrantingUserId, setIsGrantingUserId] = useState<string | null>(null);
  const [isRevokingUserId, setIsRevokingUserId] = useState<string | null>(null);
  const [revokeCandidateUserId, setRevokeCandidateUserId] = useState<string | null>(
    null,
  );

  function resetDialogState() {
    setQuery("");
    setLoadError(null);
    setStatusMessage(null);
    setIsGrantingUserId(null);
    setIsRevokingUserId(null);
    setRevokeCandidateUserId(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetDialogState();
    }

    onOpenChange(nextOpen);
  }

  const loadSharingData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const [sharesResponse, eligibleUsersResponse] = await Promise.all([
        fetchJson<DocumentShareListResult>(`/api/documents/${documentId}/shares`),
        fetchJson<EligibleShareUsersResult>(
          `/api/documents/${documentId}/shares/eligible-users`,
        ),
      ]);

      setShares(sortShares(sharesResponse.items));
      setEligibleUsers(sortUsers(eligibleUsersResponse.items));
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Sharing data could not be loaded.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const timerId = window.setTimeout(() => {
      void loadSharingData();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [loadSharingData, open]);

  async function handleGrant(user: ShareTargetRecord) {
    setStatusMessage(null);
    setIsGrantingUserId(user.id);

    try {
      const result = await fetchJson<GrantDocumentShareResult>(
        `/api/documents/${documentId}/shares`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        },
      );

      setShares((current) => {
        const next = current.filter((share) => share.user.id !== user.id);
        return sortShares([...next, result.share]);
      });
      setEligibleUsers((current) =>
        sortUsers(current.filter((candidate) => candidate.id !== user.id)),
      );
      setStatusMessage(
        result.created
          ? `Editor access granted to ${user.name}.`
          : `${user.name} already had editor access.`,
      );
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Access could not be granted.",
      );
    } finally {
      setIsGrantingUserId(null);
    }
  }

  async function handleRevoke(share: DocumentShareSummary) {
    setStatusMessage(null);
    setIsRevokingUserId(share.user.id);

    try {
      await fetchJson<void>(`/api/documents/${documentId}/shares/${share.user.id}`, {
        method: "DELETE",
      });

      setShares((current) =>
        current.filter((item) => item.user.id !== share.user.id),
      );
      setEligibleUsers((current) =>
        sortUsers([
          ...current,
          {
            id: share.user.id,
            name: share.user.name,
            email: share.user.email,
          },
        ]),
      );
      setRevokeCandidateUserId(null);
      setStatusMessage(`Access removed for ${share.user.name}.`);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Access could not be revoked.",
      );
    } finally {
      setIsRevokingUserId(null);
    }
  }

  const filteredShares = shares.filter((share) => matchesQuery(share.user, query));
  const filteredEligibleUsers = eligibleUsers.filter((user) =>
    matchesQuery(user, query),
  );

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title={`Manage access for ${documentTitle}`}
      description="Grant editor access to people in your workspace. Owners remain the only people who can rename, delete, or manage sharing."
      footer={
        <Button
          type="button"
          variant="outline"
          onClick={() => handleOpenChange(false)}
        >
          Close
        </Button>
      }
      className="max-w-3xl"
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <label
            htmlFor="share-search"
            className="text-sm font-medium text-foreground"
          >
            Find a person
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="share-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name or email"
              className="pl-9"
            />
          </div>
        </div>

        {loadError ? (
          <Alert variant="destructive">
            <AlertTitle>Sharing unavailable</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>{loadError}</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void loadSharingData()}
              >
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        {statusMessage ? (
          <Alert>
            <AlertTitle>Updated access</AlertTitle>
            <AlertDescription>{statusMessage}</AlertDescription>
          </Alert>
        ) : null}

        <section className="space-y-3 rounded-2xl border border-border/70 p-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Current access
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Shared editors can open and edit content, but only the owner can
              rename, delete, or manage sharing.
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LoaderCircle className="animate-spin" aria-hidden="true" />
              Loading shared users...
            </div>
          ) : filteredShares.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No shared editors yet.
            </p>
          ) : (
            <div className="space-y-3">
              {filteredShares.map((share) => (
                <div
                  key={share.user.id}
                  className="rounded-2xl border border-border/70 bg-background p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {share.user.name}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {share.user.email}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      disabled={isRevokingUserId === share.user.id}
                      onClick={() => setRevokeCandidateUserId(share.user.id)}
                    >
                      <UserMinus aria-hidden="true" />
                      Revoke
                    </Button>
                  </div>

                  {revokeCandidateUserId === share.user.id ? (
                    <div className="mt-4 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
                      <p className="text-sm font-medium text-foreground">
                        Remove access for {share.user.name}?
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={isRevokingUserId === share.user.id}
                          onClick={() => void handleRevoke(share)}
                        >
                          {isRevokingUserId === share.user.id
                            ? "Removing..."
                            : "Confirm revoke"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setRevokeCandidateUserId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3 rounded-2xl border border-border/70 p-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Add a shared editor
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Select an eligible person. Self-share and duplicate shares are
              blocked by the server.
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LoaderCircle className="animate-spin" aria-hidden="true" />
              Loading eligible users...
            </div>
          ) : filteredEligibleUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {eligibleUsers.length === 0
                ? "No eligible people are available for this document."
                : "No eligible users match the current search."}
            </p>
          ) : (
            <div className="space-y-3">
              {filteredEligibleUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-border/70 bg-background p-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {user.name}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    disabled={isGrantingUserId === user.id}
                    onClick={() => void handleGrant(user)}
                  >
                    {isGrantingUserId === user.id ? (
                      <>
                        <LoaderCircle className="animate-spin" aria-hidden="true" />
                        Granting...
                      </>
                    ) : (
                      <>
                        <UserPlus aria-hidden="true" />
                        Grant access
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </Dialog>
  );
}
