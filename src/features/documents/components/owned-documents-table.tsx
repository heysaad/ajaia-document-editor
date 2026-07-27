import Link from "next/link";
import { MoreHorizontal, PencilLine, Share2, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DashboardDocumentSummary } from "@/features/documents/models";

type OwnedDocumentsTableProps = {
  documents: DashboardDocumentSummary[];
  renameDocumentId: string | null;
  renameValue: string;
  onRenameValueChange: (value: string) => void;
  onRenameStart: (document: DashboardDocumentSummary) => void;
  onRenameCancel: () => void;
  onRenameSave: (documentId: string) => void;
  onShareRequest: (document: DashboardDocumentSummary) => void;
  onDeleteConfirm: (documentId: string) => void;
  isDeletingId: string | null;
  isSavingTitleId: string | null;
};

const formatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function OwnedDocumentsTable({
  documents,
  renameDocumentId,
  renameValue,
  onRenameValueChange,
  onRenameStart,
  onRenameCancel,
  onRenameSave,
  onShareRequest,
  onDeleteConfirm,
  isDeletingId,
  isSavingTitleId,
}: OwnedDocumentsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left">
        <thead className="border-b border-border/70">
          <tr className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            <th className="px-6 py-4 font-medium">Document</th>
            <th className="px-6 py-4 font-medium">Updated</th>
            <th className="px-6 py-4 font-medium">Version</th>
            <th className="px-6 py-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((document) => {
            const isRenaming = renameDocumentId === document.id;
            const isDeleting = isDeletingId === document.id;
            const isSavingTitle = isSavingTitleId === document.id;

            return (
              <tr
                key={document.id}
                data-document-id={document.id}
                className="border-b border-border/60 align-top last:border-b-0"
              >
                <td className="px-6 py-5">
                  <div className="space-y-3">
                    <Badge variant="outline">Owned</Badge>
                    {isRenaming ? (
                      <div className="max-w-md space-y-2">
                        <label
                          htmlFor={`rename-${document.id}`}
                          className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground"
                        >
                          Document title
                        </label>
                        <Input
                          id={`rename-${document.id}`}
                          value={renameValue}
                          onChange={(event) =>
                            onRenameValueChange(event.target.value)
                          }
                        />
                      </div>
                    ) : (
                      <Link
                        href={`/documents/${document.id}`}
                        className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        <span className="block text-base font-semibold text-foreground">
                          {document.title}
                        </span>
                      </Link>
                    )}
                    <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                      {document.excerpt || "This document is ready for its first edit."}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-5 text-sm text-muted-foreground">
                  {formatter.format(new Date(document.updatedAt))}
                </td>
                <td className="px-6 py-5">
                  <Badge variant="secondary">v{document.version}</Badge>
                </td>
                <td className="px-6 py-5">
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={onRenameCancel}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="cursor-pointer"
                            aria-label={`Open actions for ${document.title}`}
                          >
                            <MoreHorizontal aria-hidden="true" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-40 rounded-xl p-1">
                          <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                            <Link href={`/documents/${document.id}`}>Open</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer rounded-lg"
                            onSelect={() => onRenameStart(document)}
                          >
                            <PencilLine aria-hidden="true" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer rounded-lg"
                            onSelect={() => onShareRequest(document)}
                          >
                            <Share2 aria-hidden="true" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                className="cursor-pointer rounded-lg text-destructive focus:bg-destructive/10 focus:text-destructive"
                                disabled={isDeleting}
                              >
                                <Trash2 aria-hidden="true" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete {document.title}?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This permanently removes the document from your
                                  owned list.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Keep document</AlertDialogCancel>
                                <AlertDialogAction
                                  disabled={isDeleting}
                                  onClick={() => onDeleteConfirm(document.id)}
                                >
                                  {isDeleting ? "Deleting..." : "Confirm delete"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
