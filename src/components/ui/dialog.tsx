"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
};

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  initialFocusRef,
}: DialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousActiveElement = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTarget =
      initialFocusRef?.current ??
      contentRef.current?.querySelector<HTMLElement>("[data-autofocus]") ??
      contentRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);

    focusTarget?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onOpenChange(false);
        return;
      }

      if (event.key !== "Tab" || !contentRef.current) {
        return;
      }

      const focusableElements = Array.from(
        contentRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      if (previousActiveElement instanceof HTMLElement) {
        previousActiveElement.focus();
      }
    };
  }, [initialFocusRef, onOpenChange, open]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onOpenChange(false);
        }
      }}
    >
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          "w-full max-w-2xl rounded-3xl border border-border bg-card shadow-2xl",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border/70 px-6 py-5">
          <div className="space-y-2">
            <h2 id={titleId} className="text-lg font-semibold text-foreground">
              {title}
            </h2>
            {description ? (
              <p
                id={descriptionId}
                className="text-sm leading-6 text-muted-foreground"
              >
                {description}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => onOpenChange(false)}
          >
            <X aria-hidden="true" />
            <span className="sr-only">Close dialog</span>
          </Button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer ? (
          <div className="flex flex-col-reverse gap-2 border-t border-border/70 px-6 py-4 sm:flex-row sm:justify-end">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
