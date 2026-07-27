import Link from "next/link";
import { PencilLine, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import type { DocumentSummary } from "../models";

type DocumentCardProps = {
  document: DocumentSummary;
  isRenaming: boolean;
  renameValue: string;
  onRenameValueChange: (value: string) => void;
  onRenameStart: (document: DocumentSummary) => void;
  onRenameCancel: () => void;
  onRenameSave: (documentId: string) => void;
  onDeleteRequest: (documentId: string) => void;
  pendingDeleteId: string | null;
  onDeleteCancel: () => void;
  onDeleteConfirm: (documentId: string) => void;
  isDeleting?: boolean;
  isSavingTitle?: boolean;
};

const formatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function DocumentCard({
  document,
  isRenaming,
  renameValue,
  onRenameValueChange,
  onRenameStart,
  onRenameCancel,
  onRenameSave,
  onDeleteRequest,
  pendingDeleteId,
  onDeleteCancel,
  onDeleteConfirm,
  isDeleting = false,
  isSavingTitle = false,
}: DocumentCardProps) {
  const showDeleteConfirmation = pendingDeleteId === document.id;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col gap-5 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="success">Saved</Badge>
                <Badge variant="outline">v{document.version}</Badge>
              </div>
              {isRenaming ? (
                <div className="space-y-2">
                  <label
                    className="text-xs font-medium text-muted-foreground"
                    htmlFor={`rename-${document.id}`}
                  >
                    Document title
                  </label>
                  <input
                    id={`rename-${document.id}`}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    value={renameValue}
                    onChange={(event) => onRenameValueChange(event.target.value)}
                  />
                </div>
              ) : (
                <Link
                  href={`/documents/${document.id}`}
                  className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <h3 className="text-lg font-semibold text-foreground">
                    {document.title}
                  </h3>
                </Link>
              )}
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                {document.excerpt || "This document is ready for its first edit."}
              </p>
            </div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Updated {formatter.format(new Date(document.updatedAt))}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {isRenaming ? (
              <>
                <Button
                  size="sm"
                  disabled={isSavingTitle}
                  onClick={() => onRenameSave(document.id)}
                >
                  {isSavingTitle ? "Saving..." : "Save title"}
                </Button>
                <Button size="sm" variant="outline" onClick={onRenameCancel}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRenameStart(document)}
                >
                  <PencilLine aria-hidden="true" />
                  Rename
                </Button>
                <Button size="sm" variant="ghost" asChild>
                  <Link href={`/documents/${document.id}`}>Open document</Link>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={isDeleting}
                  className="text-destructive hover:text-destructive"
                  onClick={() => onDeleteRequest(document.id)}
                >
                  <Trash2 aria-hidden="true" />
                  Delete
                </Button>
              </>
            )}
          </div>

          {showDeleteConfirmation ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
              <p className="text-sm font-medium text-foreground">
                Delete <span className="font-semibold">{document.title}</span>?
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                This confirmation stays inline with the card so the affected
                title remains visible.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={isDeleting}
                  onClick={() => onDeleteConfirm(document.id)}
                >
                  {isDeleting ? "Deleting..." : "Confirm delete"}
                </Button>
                <Button size="sm" variant="outline" onClick={onDeleteCancel}>
                  Keep document
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
