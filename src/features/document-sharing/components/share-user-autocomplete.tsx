"use client";

import { LoaderCircle, Search } from "lucide-react";
import type { KeyboardEvent, RefObject } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ShareTargetRecord } from "@/features/document-sharing/models";

type ShareUserAutocompleteProps = {
  query: string;
  onQueryChange: (query: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: ShareTargetRecord[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  isSearching: boolean;
  error: string | null;
  onRetry: () => void;
  grantingUserIds: Set<string>;
  onGrant: (user: ShareTargetRecord) => void;
  inputRef: RefObject<HTMLInputElement | null>;
};

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function ShareUserAutocomplete({
  query,
  onQueryChange,
  open,
  onOpenChange,
  items,
  activeIndex,
  onActiveIndexChange,
  isSearching,
  error,
  onRetry,
  grantingUserIds,
  onGrant,
  inputRef,
}: ShareUserAutocompleteProps) {
  const listboxId = "share-user-suggestions";
  const activeItem = activeIndex >= 0 ? items[activeIndex] : undefined;

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      onOpenChange(true);
      if (items.length > 0) {
        onActiveIndexChange((activeIndex + 1) % items.length);
      }
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      onOpenChange(true);
      if (items.length > 0) {
        onActiveIndexChange(
          activeIndex <= 0 ? items.length - 1 : activeIndex - 1,
        );
      }
      return;
    }

    if (event.key === "Enter" && activeItem) {
      event.preventDefault();
      onGrant(activeItem);
      return;
    }

    if (event.key === "Escape" && open) {
      event.preventDefault();
      event.stopPropagation();
      onOpenChange(false);
    }
  }

  return (
    <div
      className="relative space-y-2"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          onOpenChange(false);
        }
      }}
    >
      <label
        htmlFor="share-search"
        className="text-sm font-medium text-foreground"
      >
        Add people
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          ref={inputRef}
          id="share-search"
          role="combobox"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={open}
          aria-activedescendant={
            activeItem ? `share-user-option-${activeItem.id}` : undefined
          }
          value={query}
          onFocus={() => onOpenChange(true)}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search by name or email"
          className="pl-9"
          data-autofocus
        />
      </div>

      {open ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label="People available to share with"
          className="absolute inset-x-0 top-full z-10 mt-1 max-h-72 overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-lg"
        >
          {isSearching ? (
            <div
              className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground"
              role="status"
            >
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              Searching...
            </div>
          ) : error ? (
            <div className="flex items-center justify-between gap-3 px-3 py-2">
              <p className="text-sm text-destructive">{error}</p>
              <Button type="button" size="sm" variant="ghost" onClick={onRetry}>
                Try again
              </Button>
            </div>
          ) : items.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">
              No users found.
            </p>
          ) : (
            items.map((user, index) => {
              const isGranting = grantingUserIds.has(user.id);

              return (
                <Button
                  key={user.id}
                  id={`share-user-option-${user.id}`}
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  aria-label={`Grant access to ${user.name} ${user.email}`}
                  variant="ghost"
                  className="h-auto w-full justify-start gap-3 whitespace-normal px-3 py-2 text-left"
                  disabled={isGranting}
                  onMouseMove={() => onActiveIndexChange(index)}
                  onClick={() => onGrant(user)}
                >
                  <Avatar className="size-8">
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-foreground">
                      {user.name}
                    </span>
                    <span className="block truncate text-xs font-normal text-muted-foreground">
                      {user.email}
                    </span>
                  </span>
                  {isGranting ? (
                    <LoaderCircle
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : null}
                </Button>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}
