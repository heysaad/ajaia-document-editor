"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, FileText, Plus } from "lucide-react";

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
import { DemoUserSwitcher } from "@/features/auth/components/demo-user-switcher";
import { fetchJson } from "@/lib/api-client";

import { DocumentCard } from "./document-card";
import { DocumentEmptyState } from "./document-empty-state";
import type { DocumentDetail, DocumentSummary } from "../types";

type Viewer = {
  id: string;
  name: string;
  email: string;
};

type DemoUserOption = {
  id: string;
  name: string;
  email: string;
};

type DocumentDashboardProps = {
  users: DemoUserOption[];
  viewer: Viewer | null;
  initialDocuments: DocumentSummary[];
};

export function DocumentDashboard({
  users,
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
      className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8"
    >
      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader className="gap-4 border-b border-border/70 bg-[linear-gradient(135deg,rgba(99,102,241,0.08),transparent_65%)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <Badge>Your workspace</Badge>
                <CardTitle className="text-3xl sm:text-4xl">
                  Pick up where you left off.
                </CardTitle>
                <CardDescription className="max-w-2xl text-base">
                  Create a document, shape your ideas, and trust that every
                  change is saved as you work.
                </CardDescription>
              </div>
              <Button
                size="lg"
                disabled={!viewer || isCreating}
                onClick={() => void handleCreateDocument()}
              >
                <Plus aria-hidden="true" />
                {isCreating ? "Creating document..." : "Create untitled document"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 p-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
              <p className="text-sm text-muted-foreground">Visible documents</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {documents.length}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
              <p className="text-sm text-muted-foreground">Save mode</p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                Automatic
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
              <p className="text-sm text-muted-foreground">Current reviewer</p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {viewer ? viewer.name : "Choose a demo user"}
              </p>
            </div>
          </CardContent>
        </Card>

        <DemoUserSwitcher
          users={users}
          selectedUserId={viewer?.id ?? null}
          onUserChanged={() => {
            setRenameDocumentId(null);
            setPendingDeleteId(null);
          }}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.7fr_0.9fr]">
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

          {!viewer ? (
            <Card>
              <CardContent className="p-6 text-sm leading-6 text-muted-foreground">
                Select one of the seeded demo users to load their persisted
                documents and enable create, rename, delete, and editor actions.
              </CardContent>
            </Card>
          ) : documents.length === 0 ? (
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

        <Card>
          <CardHeader>
            <Badge variant="secondary">Good to know</Badge>
            <CardTitle className="mt-3">A calm place to write</CardTitle>
            <CardDescription>
              Your documents stay private to the selected demo user.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <div className="rounded-2xl border border-border/70 bg-background/85 p-4">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <FileText className="size-4 text-primary" aria-hidden="true" />
                Separate workspaces
              </div>
              <p className="mt-2">
                Switch demo users to see how each person gets an independent
                document library.
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/85 p-4">
              <div className="font-medium text-foreground">Safe recovery</div>
              <p className="mt-2">
                Failed saves remain visible without interrupting your writing,
                and local edits stay available for retry.
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/85 p-4">
              <div className="font-medium text-foreground">
                Always up to date
              </div>
              <p className="mt-2">
                Open any document to continue from the latest confirmed copy.
              </p>
              {documents[0] ? (
                <Button asChild className="mt-4" variant="outline" size="sm">
                  <Link href={`/documents/${documents[0].id}`}>
                    Open latest document
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
