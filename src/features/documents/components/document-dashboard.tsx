"use client";

import { useState } from "react";
import { FileUp, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentImportDialog } from "@/features/document-import/components/document-import-dialog";
import { DocumentShareDialog } from "@/features/document-sharing/components/document-share-dialog";
import { fetchJson } from "@/lib/api-client";

import { DocumentEmptyState } from "./document-empty-state";
import { DocumentsErrorState } from "./documents-error-state";
import { OwnedDocumentsTable } from "./owned-documents-table";
import { SharedDocumentsTable } from "./shared-documents-table";
import type {
  DashboardDocumentSummary,
  DocumentDashboardData,
  DocumentPaginationInfo,
  DocumentDetail,
  DashboardDocumentListResult,
} from "../models";
import { DOCUMENT_LIST_PAGE_LIMIT } from "../server/document-constants";

type DocumentDashboardProps = {
  initialData?: Partial<DocumentDashboardData>;
};

function createDefaultPagination(): DocumentPaginationInfo {
  return {
    page: 1,
    pageSize: DOCUMENT_LIST_PAGE_LIMIT,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };
}

function normalizeList(
  list?: Partial<DashboardDocumentListResult>,
): DashboardDocumentListResult {
  const pagination = list?.pagination ?? createDefaultPagination();

  return {
    items: list?.items ?? [],
    pagination: {
      page: pagination.page ?? 1,
      pageSize: pagination.pageSize ?? DOCUMENT_LIST_PAGE_LIMIT,
      totalItems: pagination.totalItems ?? 0,
      totalPages: pagination.totalPages ?? 1,
      hasNextPage: pagination.hasNextPage ?? false,
      hasPreviousPage: pagination.hasPreviousPage ?? false,
    },
  };
}

export function DocumentDashboard({
  initialData,
}: DocumentDashboardProps) {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DocumentDashboardData>({
    owned: normalizeList(initialData?.owned),
    shared: normalizeList(initialData?.shared),
  });
  const [ownedErrorMessage, setOwnedErrorMessage] = useState<string | null>(null);
  const [sharedErrorMessage, setSharedErrorMessage] = useState<string | null>(null);
  const [isOwnedPageLoading, setIsOwnedPageLoading] = useState(false);
  const [isSharedPageLoading, setIsSharedPageLoading] = useState(false);
  const [renameDocumentId, setRenameDocumentId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isSavingTitleId, setIsSavingTitleId] = useState<string | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [shareDialogDocument, setShareDialogDocument] =
    useState<DashboardDocumentSummary | null>(null);

  async function reloadDashboard(target: "owned" | "shared") {
    const pageSize =
      dashboardData.owned.pagination.pageSize ??
      dashboardData.shared.pagination.pageSize ??
      DOCUMENT_LIST_PAGE_LIMIT;

    if (target === "owned") {
      setIsOwnedPageLoading(true);
      setOwnedErrorMessage(null);
    } else {
      setIsSharedPageLoading(true);
      setSharedErrorMessage(null);
    }

    try {
      const nextData = await fetchJson<DocumentDashboardData>(
        `/api/documents?ownedPage=${dashboardData.owned.pagination.page}&sharedPage=${dashboardData.shared.pagination.page}&pageSize=${pageSize}`,
      );

      setDashboardData(nextData);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not load documents.";

      if (target === "owned") {
        setOwnedErrorMessage(message);
      } else {
        setSharedErrorMessage(message);
      }
    } finally {
      if (target === "owned") {
        setIsOwnedPageLoading(false);
      } else {
        setIsSharedPageLoading(false);
      }
    }
  }

  async function handlePageChange(target: "owned" | "shared", page: number) {
    const pageSize =
      dashboardData.owned.pagination.pageSize ??
      dashboardData.shared.pagination.pageSize ??
      DOCUMENT_LIST_PAGE_LIMIT;

    if (target === "owned") {
      setIsOwnedPageLoading(true);
      setOwnedErrorMessage(null);
    } else {
      setIsSharedPageLoading(true);
      setSharedErrorMessage(null);
    }

    try {
      const nextData = await fetchJson<DocumentDashboardData>(
        `/api/documents?ownedPage=${target === "owned" ? page : dashboardData.owned.pagination.page}&sharedPage=${target === "shared" ? page : dashboardData.shared.pagination.page}&pageSize=${pageSize}`,
      );

      setDashboardData(nextData);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not load documents.";

      if (target === "owned") {
        setOwnedErrorMessage(message);
      } else {
        setSharedErrorMessage(message);
      }
    } finally {
      if (target === "owned") {
        setIsOwnedPageLoading(false);
      } else {
        setIsSharedPageLoading(false);
      }
    }
  }

  async function handleCreateDocument() {
    setOwnedErrorMessage(null);
    setSharedErrorMessage(null);
    setIsCreating(true);

    try {
      const createdDocument = await fetchJson<DocumentDetail>("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      router.push(`/documents/${createdDocument.id}`);
    } catch (error) {
      setOwnedErrorMessage(
        error instanceof Error ? error.message : "Could not create the document.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function handleRenameDocument(documentId: string) {
    setOwnedErrorMessage(null);
    setIsSavingTitleId(documentId);

    try {
      await fetchJson<DocumentDetail>(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: renameValue }),
      });

      setRenameDocumentId(null);
      setRenameValue("");
      await reloadDashboard("owned");
    } catch (error) {
      setOwnedErrorMessage(
        error instanceof Error ? error.message : "Could not rename the document.",
      );
    } finally {
      setIsSavingTitleId(null);
    }
  }

  async function handleDeleteDocument(documentId: string) {
    setOwnedErrorMessage(null);
    setIsDeletingId(documentId);

    try {
      await fetchJson<void>(`/api/documents/${documentId}`, {
        method: "DELETE",
      });

      await reloadDashboard("owned");
    } catch (error) {
      setOwnedErrorMessage(
        error instanceof Error ? error.message : "Could not delete the document.",
      );
    } finally {
      setIsDeletingId(null);
    }
  }

  const ownedDocuments = dashboardData.owned.items;
  const sharedDocuments = dashboardData.shared.items;

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

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl font-semibold text-foreground">Owned by me</h2>
          <Badge variant="outline">
            {dashboardData.owned.pagination.totalItems} documents
          </Badge>
        </div>

        {ownedErrorMessage ? (
          <DocumentsErrorState
            onRetry={() => void reloadDashboard("owned")}
          />
        ) : null}

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
                pagination={dashboardData.owned.pagination}
                isPaginationLoading={isOwnedPageLoading}
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
                onPageChange={(page) => void handlePageChange("owned", page)}
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
          <Badge variant="outline">
            {dashboardData.shared.pagination.totalItems} documents
          </Badge>
        </div>

        {sharedErrorMessage ? (
          <DocumentsErrorState
            onRetry={() => void reloadDashboard("shared")}
          />
        ) : null}

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
              <SharedDocumentsTable
                documents={sharedDocuments}
                pagination={dashboardData.shared.pagination}
                isPaginationLoading={isSharedPageLoading}
                onPageChange={(page) => void handlePageChange("shared", page)}
              />
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
