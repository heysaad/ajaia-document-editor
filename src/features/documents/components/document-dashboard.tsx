"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

import { DocumentCard } from "./document-card";
import { DocumentEmptyState } from "./document-empty-state";
import type { DocumentDetail, DocumentSummary } from "../models";

type Viewer = {
  id: string;
  name: string;
  email: string;
};

type DocumentDashboardProps = {
  viewer: Viewer;
  initialDocuments: DocumentSummary[];
};

export function DocumentDashboard({
  viewer,
  initialDocuments,
}: DocumentDashboardProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState(initialDocuments);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [renameDocumentId, setRenameDocumentId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isSavingTitleId, setIsSavingTitleId] = useState<string | null>(null);

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

      setDocuments((current) =>
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

      setDocuments((current) =>
        current.filter((document) => document.id !== documentId),
      );
      setPendingDeleteId(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not delete the document.",
      );
    } finally {
      setIsDeletingId(null);
    }
  }

  return (
    <main
      id="main-content"
      className="flex w-full flex-1 flex-col gap-8"
    >
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_360px]">
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="gap-5 border-b border-border/70 bg-[linear-gradient(135deg,rgba(87,91,232,0.11),transparent_65%)] sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-3">
                <Badge>Your workspace</Badge>
                <div className="space-y-2">
                  <CardTitle className="text-3xl tracking-tight sm:text-4xl">
                    Pick up where you left off.
                  </CardTitle>
                  <CardDescription className="max-w-2xl text-base">
                    Create a document, shape your ideas, and trust that every
                    change is saved as you work.
                  </CardDescription>
                </div>
              </div>
              <Button
                size="lg"
                disabled={isCreating}
                onClick={() => void handleCreateDocument()}
              >
                <Plus aria-hidden="true" />
                {isCreating ? "Creating document..." : "Create document"}
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4 p-6 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                <p className="text-sm text-muted-foreground">Documents</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {documents.length}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                <p className="text-sm text-muted-foreground">Signed-in account</p>
                <p className="mt-2 truncate text-lg font-semibold text-foreground">
                  {viewer.name}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {viewer.email}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                <p className="text-sm text-muted-foreground">Default save mode</p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  Automatic
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">
                  Owned documents
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create, rename, open, or remove documents from one place.
                </p>
              </div>
              <Badge variant="outline">{documents.length} visible</Badge>
            </div>

            {errorMessage ? (
              <Alert variant="destructive">
                <AlertTitle>Action failed</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            ) : null}

            {documents.length === 0 ? (
              <DocumentEmptyState
                isCreating={isCreating}
                onCreate={() => void handleCreateDocument()}
              />
            ) : (
              <div className="space-y-4">
                {documents.map((document) => (
                  <DocumentCard
                    key={document.id}
                    document={document}
                    isRenaming={renameDocumentId === document.id}
                    renameValue={renameValue}
                    onRenameValueChange={setRenameValue}
                    onRenameStart={(nextDocument) => {
                      setRenameDocumentId(nextDocument.id);
                      setRenameValue(nextDocument.title);
                      setPendingDeleteId(null);
                    }}
                    onRenameCancel={() => {
                      setRenameDocumentId(null);
                      setRenameValue("");
                    }}
                    onRenameSave={(documentId) =>
                      void handleRenameDocument(documentId)
                    }
                    onDeleteRequest={(documentId) => {
                      setPendingDeleteId(documentId);
                      setRenameDocumentId(null);
                    }}
                    pendingDeleteId={pendingDeleteId}
                    onDeleteCancel={() => setPendingDeleteId(null)}
                    onDeleteConfirm={(documentId) =>
                      void handleDeleteDocument(documentId)
                    }
                    isDeleting={isDeletingId === document.id}
                    isSavingTitle={isSavingTitleId === document.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <Badge variant="secondary">Account</Badge>
            <CardTitle className="mt-3">Signed-in user</CardTitle>
            <CardDescription>
              Your documents stay private to the selected account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-background/85 p-4">
              <p className="text-sm font-medium text-foreground">Name</p>
              <p className="mt-1 text-sm text-muted-foreground">{viewer.name}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/85 p-4">
              <p className="text-sm font-medium text-foreground">Email</p>
              <p className="mt-1 break-all text-sm text-muted-foreground">
                {viewer.email}
              </p>
            </div>
            {documents[0] ? (
              <div className="rounded-2xl border border-border/70 bg-background/85 p-4">
                <p className="text-sm font-medium text-foreground">Latest document</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {documents[0].title}
                </p>
                <Button asChild className="mt-4 w-full" variant="outline" size="sm">
                  <Link href={`/documents/${documents[0].id}`}>
                    Open latest document
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
