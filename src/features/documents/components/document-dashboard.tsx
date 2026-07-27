"use client";

import { useState } from "react";
import { FileUp, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentImportDialog } from "@/features/document-import/components/document-import-dialog";
import { DocumentShareDialog } from "@/features/document-sharing/components/document-share-dialog";
import { fetchJson } from "@/lib/api-client";

import { DocumentEmptyState } from "./document-empty-state";
import { OwnedDocumentsTable } from "./owned-documents-table";
import { SharedDocumentsTable } from "./shared-documents-table";
import type {
  DashboardDocumentSummary,
  DocumentDashboardData,
  DocumentDetail,
} from "../models";

type DocumentDashboardProps = {
  initialData?: Partial<DocumentDashboardData>;
};

export function DocumentDashboard({
  initialData,
}: DocumentDashboardProps) {
  const router = useRouter();
  const [ownedDocuments, setOwnedDocuments] = useState<DashboardDocumentSummary[]>(
    initialData?.owned?.items ?? [],
  );
  const [sharedDocuments] = useState<DashboardDocumentSummary[]>(
    initialData?.shared?.items ?? [],
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [renameDocumentId, setRenameDocumentId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isSavingTitleId, setIsSavingTitleId] = useState<string | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [shareDialogDocument, setShareDialogDocument] =
    useState<DashboardDocumentSummary | null>(null);

  async function handleCreateDocument() {
    setErrorMessage(null);
    setIsCreating(true);

    try {
      const createdDocument = await fetchJson<DocumentDetail>("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      router.push(`/documents/${createdDocument.id}`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not create the document.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function handleRenameDocument(documentId: string) {
    setErrorMessage(null);
    setIsSavingTitleId(documentId);

    try {
      const updatedDocument = await fetchJson<DocumentDetail>(
        `/api/documents/${documentId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: renameValue }),
        },
      );

      setOwnedDocuments((current) =>
        current.map((document) =>
          document.id === documentId ? updatedDocument : document,
        ),
      );
      setRenameDocumentId(null);
      setRenameValue("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not rename the document.",
      );
    } finally {
      setIsSavingTitleId(null);
    }
  }

  async function handleDeleteDocument(documentId: string) {
    setErrorMessage(null);
    setIsDeletingId(documentId);

    try {
      await fetchJson<void>(`/api/documents/${documentId}`, {
        method: "DELETE",
      });

      setOwnedDocuments((current) =>
        current.filter((document) => document.id !== documentId),
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not delete the document.",
      );
    } finally {
      setIsDeletingId(null);
    }
  }

  return (
    <main id="main-content" className="flex w-full flex-1 flex-col gap-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Badge variant="outline">Workspace</Badge>
          <h1 className="text-3xl font-semibold text-foreground">Documents</h1>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Button
            size="lg"
            disabled={isCreating}
            onClick={() => void handleCreateDocument()}
          >
            <Plus aria-hidden="true" />
            {isCreating ? "Creating..." : "Add document"}
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setIsImportDialogOpen(true)}
          >
            <FileUp aria-hidden="true" />
            Import file
          </Button>
        </div>
      </section>

      {errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Action failed</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl font-semibold text-foreground">Owned by me</h2>
          <Badge variant="outline">{ownedDocuments.length} documents</Badge>
        </div>

        <Card>
          <CardHeader className="border-b border-border/70 pb-4">
            <CardTitle className="text-base">Document library</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {ownedDocuments.length === 0 ? (
              <div className="p-6">
                <DocumentEmptyState
                  isCreating={isCreating}
                  onCreate={() => void handleCreateDocument()}
                  onImportRequest={() => setIsImportDialogOpen(true)}
                />
              </div>
            ) : (
              <OwnedDocumentsTable
                documents={ownedDocuments}
                renameDocumentId={renameDocumentId}
                renameValue={renameValue}
                onRenameValueChange={setRenameValue}
                onRenameStart={(nextDocument) => {
                  setRenameDocumentId(nextDocument.id);
                  setRenameValue(nextDocument.title);
                }}
                onRenameCancel={() => {
                  setRenameDocumentId(null);
                  setRenameValue("");
                }}
                onRenameSave={(documentId) =>
                  void handleRenameDocument(documentId)
                }
                onShareRequest={setShareDialogDocument}
                onDeleteConfirm={(documentId) =>
                  void handleDeleteDocument(documentId)
                }
                isDeletingId={isDeletingId}
                isSavingTitleId={isSavingTitleId}
              />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl font-semibold text-foreground">Shared with me</h2>
          <Badge variant="outline">{sharedDocuments.length} documents</Badge>
        </div>

        <Card>
          <CardHeader className="border-b border-border/70 pb-4">
            <CardTitle className="text-base">Shared document library</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {sharedDocuments.length === 0 ? (
              <div className="p-6">
                <Card className="border-dashed shadow-none">
                  <CardHeader>
                    <CardTitle className="text-base">
                      No shared documents yet
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>
            ) : (
              <SharedDocumentsTable documents={sharedDocuments} />
            )}
          </CardContent>
        </Card>
      </section>

      <DocumentImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImported={(document) => {
          router.push(`/documents/${document.id}`);
        }}
      />

      {shareDialogDocument ? (
        <DocumentShareDialog
          open
          onOpenChange={(open) => {
            if (!open) {
              setShareDialogDocument(null);
            }
          }}
          documentId={shareDialogDocument.id}
          documentTitle={shareDialogDocument.title}
        />
      ) : null}
    </main>
  );
}
