import type { JSONContent } from "@tiptap/core";

import { convertImportedDocument } from "@/features/document-import/server/import-document";
import {
  createEmptyDocumentContent,
  documentContentToPlainText,
  parseDocumentContent,
} from "@/features/document-editing/server/document-content";
import type {
  DocumentShareListResult,
  DocumentShareSummary,
  EligibleShareUsersResult,
  GrantDocumentShareResult,
} from "@/features/document-sharing/models";
import {
  resolveDocumentAccess,
  toDocumentAccessRole,
  type DocumentAccessState,
} from "@/features/document-sharing/server/document-access-policy";
import { normalizeShareEmail } from "@/features/document-sharing/server/share-email";
import type {
  CreateDocumentInput,
  DeleteDocumentInput,
  DocumentDashboardData,
  DocumentDetail,
  DocumentListResult,
  DocumentRecord,
  DocumentViewerRecord,
  DashboardDocumentSummary,
  GetDocumentForViewerInput,
  GetOwnedDocumentInput,
  GrantDocumentShareInput,
  ImportDocumentInput,
  ListDashboardDocumentsInput,
  ListDocumentSharesInput,
  ListEligibleShareUsersRequest,
  ListOwnedDocumentsInput,
  RenameDocumentInput,
  RevokeDocumentShareInput,
  UpdateDocumentContentInput,
} from "@/features/documents/models";
import type { IDocumentRepository } from "@/features/documents/server/IDocumentRepository";
import type { IDocumentService } from "@/features/documents/server/IDocumentService";
import {
  normalizeCreateTitle,
  normalizeRenameTitle,
} from "@/features/documents/server/document-title";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/application-errors";

function toSummary(
  document: DocumentRecord,
  accessState: Exclude<DocumentAccessState, "none">,
): DashboardDocumentSummary {
  return {
    id: document.id,
    title: document.title,
    excerpt: document.contentText,
    version: document.version,
    updatedAt: document.updatedAt.toISOString(),
    accessRole: toDocumentAccessRole(accessState),
    owner: document.owner,
  };
}

function toPagination(page: number, pageSize: number, totalItems: number) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

function toDetail(
  document: DocumentRecord,
  accessState: Exclude<DocumentAccessState, "none">,
): DocumentDetail {
  return {
    id: document.id,
    title: document.title,
    excerpt: document.contentText,
    version: document.version,
    updatedAt: document.updatedAt.toISOString(),
    contentJson: document.contentJson as JSONContent,
    createdAt: document.createdAt.toISOString(),
    owner: document.owner,
    accessRole: toDocumentAccessRole(accessState),
  };
}

function toShareSummary(share: {
  user: {
    id: string;
    name: string;
    email: string;
  };
  role: "EDITOR";
  createdAt: Date;
}): DocumentShareSummary {
  return {
    user: share.user,
    role: share.role,
    createdAt: share.createdAt.toISOString(),
  };
}

async function getViewerDocumentOrThrow(
  repository: IDocumentRepository,
  documentId: string,
  viewerId: string,
): Promise<{
  document: DocumentViewerRecord;
  accessState: Exclude<DocumentAccessState, "none">;
}> {
  const document = await repository.findByIdForViewer({
    documentId,
    viewerId,
  });

  if (!document) {
    throw new NotFoundError("Document not found.");
  }

  const accessState = resolveDocumentAccess(document, viewerId);
  if (accessState === "none") {
    throw new NotFoundError("Document not found.");
  }

  return {
    document,
    accessState,
  };
}

async function requireOwnerDocumentOrThrow(
  repository: IDocumentRepository,
  documentId: string,
  ownerId: string,
) {
  const { document, accessState } = await getViewerDocumentOrThrow(
    repository,
    documentId,
    ownerId,
  );

  if (accessState !== "owner") {
    throw new ForbiddenError();
  }

  return document;
}

export class DocumentService implements IDocumentService {
  constructor(private readonly repository: IDocumentRepository) {}

  async createDocument(input: CreateDocumentInput): Promise<DocumentDetail> {
    const contentJson = createEmptyDocumentContent();
    const document = await this.repository.create({
      id: crypto.randomUUID(),
      ownerId: input.ownerId,
      title: normalizeCreateTitle(input.title),
      contentJson,
      contentText: "",
    });

    return toDetail(document, "owner");
  }

  async importDocument(input: ImportDocumentInput): Promise<DocumentDetail> {
    const imported = convertImportedDocument({
      fileName: input.fileName,
      mimeType: input.mimeType,
      fileSize: input.fileSize,
      fileContent: input.fileContent,
    });
    const document = await this.repository.create({
      id: crypto.randomUUID(),
      ownerId: input.ownerId,
      title: normalizeCreateTitle(imported.title),
      contentJson: imported.contentJson,
      contentText: imported.contentText,
    });

    return toDetail(document, "owner");
  }

  async listDashboardDocuments(
    input: ListDashboardDocumentsInput,
  ): Promise<DocumentDashboardData> {
    const [ownedDocuments, sharedDocuments] = await Promise.all([
      this.repository.listOwnedPage({
        ownerId: input.viewerId,
        page: input.ownedPage ?? 1,
        pageSize: input.pageSize,
      }),
      this.repository.listSharedPage({
        viewerId: input.viewerId,
        page: input.sharedPage ?? 1,
        pageSize: input.pageSize,
      }),
    ]);

    return {
      owned: {
        items: ownedDocuments.items.map((document) => toSummary(document, "owner")),
        pagination: toPagination(
          ownedDocuments.page,
          ownedDocuments.pageSize,
          ownedDocuments.totalItems,
        ),
      },
      shared: {
        items: sharedDocuments.items.map((document) => toSummary(document, "shared_editor")),
        pagination: toPagination(
          sharedDocuments.page,
          sharedDocuments.pageSize,
          sharedDocuments.totalItems,
        ),
      },
    };
  }

  async listOwnedDocuments(
    input: ListOwnedDocumentsInput,
  ): Promise<DocumentListResult> {
    const documents = await this.repository.listOwned({
      ownerId: input.ownerId,
      cursor: input.cursor,
      limit: input.limit + 1,
    });

    const hasMore = documents.length > input.limit;
    const items = hasMore ? documents.slice(0, input.limit) : documents;

    return {
      items: items.map((document) => toSummary(document, "owner")),
      nextCursor: hasMore ? items.at(-1)?.id ?? null : null,
    };
  }

  async getDocumentForViewer(
    input: GetDocumentForViewerInput,
  ): Promise<DocumentDetail> {
    const { document, accessState } = await getViewerDocumentOrThrow(
      this.repository,
      input.documentId,
      input.viewerId,
    );

    return toDetail(document, accessState);
  }

  async getOwnedDocument(input: GetOwnedDocumentInput): Promise<DocumentDetail> {
    return this.getDocumentForViewer({
      viewerId: input.ownerId,
      documentId: input.documentId,
    });
  }

  async renameDocument(input: RenameDocumentInput): Promise<DocumentDetail> {
    await requireOwnerDocumentOrThrow(
      this.repository,
      input.documentId,
      input.ownerId,
    );

    const document = await this.repository.updateTitle({
      id: input.documentId,
      title: normalizeRenameTitle(input.title),
    });

    return toDetail(document, "owner");
  }

  async deleteDocument(input: DeleteDocumentInput): Promise<void> {
    await requireOwnerDocumentOrThrow(
      this.repository,
      input.documentId,
      input.ownerId,
    );

    await this.repository.deleteById(input.documentId);
  }

  async updateDocumentContent(
    input: UpdateDocumentContentInput,
  ): Promise<DocumentDetail> {
    const { document: currentDocument, accessState } =
      await getViewerDocumentOrThrow(
        this.repository,
        input.documentId,
        input.viewerId,
      );
    const parsedContent = parseDocumentContent(input.content);
    const contentText = documentContentToPlainText(parsedContent);

    const updatedCount = await this.repository.updateContentIfVersionMatches({
      id: input.documentId,
      viewerId: input.viewerId,
      expectedVersion: input.expectedVersion,
      contentJson: parsedContent,
      contentText,
    });

    if (updatedCount === 0) {
      const latestDocument = await this.getDocumentForViewer({
        viewerId: input.viewerId,
        documentId: input.documentId,
      });

      throw new ConflictError("A newer version of this document exists.", {
        latestDocument,
      });
    }

    const savedDocument = await this.getDocumentForViewer({
      viewerId: input.viewerId,
      documentId: input.documentId,
    });

    if (savedDocument.version !== currentDocument.version + 1) {
      throw new ConflictError("Document version changed unexpectedly.", {
        latestDocument: savedDocument,
      });
    }

    return {
      ...savedDocument,
      accessRole: toDocumentAccessRole(accessState),
    };
  }

  async listDocumentShares(
    input: ListDocumentSharesInput,
  ): Promise<DocumentShareListResult> {
    await requireOwnerDocumentOrThrow(
      this.repository,
      input.documentId,
      input.ownerId,
    );

    const shares = await this.repository.listShares(input.documentId);
    return {
      items: shares.map(toShareSummary),
    };
  }

  async listEligibleShareUsers(
    input: ListEligibleShareUsersRequest,
  ): Promise<EligibleShareUsersResult> {
    await requireOwnerDocumentOrThrow(
      this.repository,
      input.documentId,
      input.ownerId,
    );

    return {
      items: await this.repository.listEligibleShareUsers({
        documentId: input.documentId,
        ownerId: input.ownerId,
      }),
    };
  }

  async grantDocumentShare(
    input: GrantDocumentShareInput,
  ): Promise<GrantDocumentShareResult> {
    const ownerDocument = await requireOwnerDocumentOrThrow(
      this.repository,
      input.documentId,
      input.ownerId,
    );
    const normalizedEmail = input.email
      ? normalizeShareEmail(input.email)
      : undefined;

    if (
      input.userId === input.ownerId ||
      normalizedEmail === normalizeShareEmail(ownerDocument.owner.email)
    ) {
      throw new ValidationError("You cannot share a document with yourself.", {
        field: "shareTarget",
        reason: "self_share_not_allowed",
      });
    }

    const target = await this.repository.findShareTarget({
      userId: input.userId,
      normalizedEmail,
    });

    if (!target) {
      throw new ValidationError("The selected user cannot be granted access.", {
        field: "shareTarget",
        reason: "invalid_share_target",
      });
    }

    if (target.id === input.ownerId) {
      throw new ValidationError("You cannot share a document with yourself.", {
        field: "shareTarget",
        reason: "self_share_not_allowed",
      });
    }

    const result = await this.repository.createShareIfMissing({
      documentId: input.documentId,
      userId: target.id,
      role: "EDITOR",
    });

    return {
      share: toShareSummary(result.share),
      created: result.created,
    };
  }

  async revokeDocumentShare(input: RevokeDocumentShareInput): Promise<void> {
    await requireOwnerDocumentOrThrow(
      this.repository,
      input.documentId,
      input.ownerId,
    );

    const deletedCount = await this.repository.deleteShare(
      input.documentId,
      input.userId,
    );

    if (deletedCount === 0) {
      throw new NotFoundError("Document share not found.");
    }
  }
}
