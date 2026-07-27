"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { GrantedUsersList } from "@/features/document-sharing/components/granted-users-list";
import { ShareUserAutocomplete } from "@/features/document-sharing/components/share-user-autocomplete";
import {
  type DocumentShareListResult,
  type DocumentShareSummary,
  type EligibleShareUsersResult,
  type GrantDocumentShareResult,
  type ShareTargetRecord,
} from "@/features/document-sharing/models";
import { fetchJson } from "@/lib/api-client";

type DocumentShareDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentTitle: string;
};

const SEARCH_DEBOUNCE_MS = 250;

function sortShares(items: DocumentShareSummary[]) {
  return [...items].sort(
    (left, right) =>
      left.user.name.localeCompare(right.user.name) ||
      left.user.email.localeCompare(right.user.email),
  );
}

export function DocumentShareDialog({
  open,
  onOpenChange,
  documentId,
  documentTitle,
}: DocumentShareDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const suppressNextAutocompleteOpenRef = useRef(false);
  const [query, setQuery] = useState("");
  const [shares, setShares] = useState<DocumentShareSummary[]>([]);
  const [suggestions, setSuggestions] = useState<ShareTargetRecord[]>([]);
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [searchRevision, setSearchRevision] = useState(0);
  const [isLoadingShares, setIsLoadingShares] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [grantingUserIds, setGrantingUserIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [isRevokingUserId, setIsRevokingUserId] = useState<string | null>(null);

  const resetDialogState = useCallback(() => {
    setQuery("");
    setShares([]);
    setSuggestions([]);
    setIsAutocompleteOpen(false);
    setActiveSuggestionIndex(-1);
    setLoadError(null);
    setSearchError(null);
    setMutationError(null);
    setStatusMessage(null);
    setGrantingUserIds(new Set());
    setIsRevokingUserId(null);
  }, []);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    if (!nextOpen) {
      resetDialogState();
    }

    onOpenChange(nextOpen);
  }, [onOpenChange, resetDialogState]);

  function handleAutocompleteOpenChange(nextOpen: boolean) {
    if (nextOpen && suppressNextAutocompleteOpenRef.current) {
      suppressNextAutocompleteOpenRef.current = false;
      return;
    }

    setIsAutocompleteOpen(nextOpen);
  }

  const loadShares = useCallback(async () => {
    setIsLoadingShares(true);
    setLoadError(null);

    try {
      const response = await fetchJson<DocumentShareListResult>(
        `/api/documents/${documentId}/shares`,
      );
      setShares(sortShares(response.items));
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "People with access could not be loaded.",
      );
    } finally {
      setIsLoadingShares(false);
    }
  }, [documentId]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const timerId = window.setTimeout(() => {
      void loadShares();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [loadShares, open]);

  useEffect(() => {
    if (!open || !isAutocompleteOpen) {
      return;
    }

    const controller = new AbortController();
    let isCurrentRequest = true;
    const timerId = window.setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);

      try {
        const response = await fetchJson<EligibleShareUsersResult>(
          `/api/documents/${documentId}/shares/eligible-users?q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal },
        );

        if (isCurrentRequest) {
          setSuggestions(response.items);
          setActiveSuggestionIndex(-1);
        }
      } catch (error) {
        if (isCurrentRequest && !controller.signal.aborted) {
          setSuggestions([]);
          setSearchError(
            error instanceof Error ? error.message : "Users could not be found.",
          );
        }
      } finally {
        if (isCurrentRequest) {
          setIsSearching(false);
        }
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      isCurrentRequest = false;
      window.clearTimeout(timerId);
      controller.abort();
    };
  }, [documentId, isAutocompleteOpen, open, query, searchRevision]);

  async function handleGrant(user: ShareTargetRecord) {
    setStatusMessage(null);
    setMutationError(null);
    setGrantingUserIds((current) => new Set(current).add(user.id));

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
        const withoutUser = current.filter(
          (share) => share.user.id !== result.share.user.id,
        );
        return sortShares([...withoutUser, result.share]);
      });
      setSuggestions([]);
      setQuery("");
      setIsAutocompleteOpen(false);
      setActiveSuggestionIndex(-1);
      setStatusMessage(
        result.created
          ? `Editor access granted to ${user.name}.`
          : `${user.name} already had editor access.`,
      );
      suppressNextAutocompleteOpenRef.current = true;
      window.setTimeout(() => inputRef.current?.focus(), 0);
    } catch (error) {
      setMutationError(
        error instanceof Error ? error.message : "Access could not be granted.",
      );
    } finally {
      setGrantingUserIds((current) => {
        const next = new Set(current);
        next.delete(user.id);
        return next;
      });
    }
  }

  async function handleRevoke(share: DocumentShareSummary) {
    setStatusMessage(null);
    setMutationError(null);
    setIsRevokingUserId(share.user.id);

    try {
      await fetchJson<void>(
        `/api/documents/${documentId}/shares/${share.user.id}`,
        { method: "DELETE" },
      );
      setShares((current) =>
        current.filter((item) => item.user.id !== share.user.id),
      );
      setStatusMessage(`Access removed for ${share.user.name}.`);
      return true;
    } catch (error) {
      setMutationError(
        error instanceof Error ? error.message : "Access could not be revoked.",
      );
      return false;
    } finally {
      setIsRevokingUserId(null);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title={`Manage access for ${documentTitle}`}
      description="Add editors or remove access to this document."
      footer={
        <Button
          type="button"
          variant="outline"
          onClick={() => handleOpenChange(false)}
        >
          Close
        </Button>
      }
      className="max-w-xl"
      initialFocusRef={inputRef}
    >
      <div className="space-y-5">
        <ShareUserAutocomplete
          query={query}
          onQueryChange={(nextQuery) => {
            setQuery(nextQuery);
            setActiveSuggestionIndex(-1);
            setIsAutocompleteOpen(true);
          }}
          open={isAutocompleteOpen}
          onOpenChange={handleAutocompleteOpenChange}
          items={suggestions}
          activeIndex={activeSuggestionIndex}
          onActiveIndexChange={setActiveSuggestionIndex}
          isSearching={isSearching}
          error={searchError}
          onRetry={() => setSearchRevision((current) => current + 1)}
          grantingUserIds={grantingUserIds}
          onGrant={(user) => void handleGrant(user)}
          inputRef={inputRef}
        />

        {loadError ? (
          <Alert variant="destructive">
            <AlertTitle>Sharing unavailable</AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-3">
              <span>{loadError}</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void loadShares()}
              >
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        {mutationError ? (
          <Alert variant="destructive">
            <AlertTitle>Access was not updated</AlertTitle>
            <AlertDescription>{mutationError}</AlertDescription>
          </Alert>
        ) : null}

        {statusMessage ? (
          <p className="text-sm text-muted-foreground" role="status">
            {statusMessage}
          </p>
        ) : null}

        <GrantedUsersList
          shares={shares}
          isLoading={isLoadingShares}
          isRevokingUserId={isRevokingUserId}
          onRevoke={handleRevoke}
        />
      </div>
    </Dialog>
  );
}
