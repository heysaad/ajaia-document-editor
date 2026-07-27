import type { JSONContent } from "@tiptap/core";

import {
  createEmptyDocumentContent,
  documentContentToPlainText,
  parseDocumentContent,
} from "@/features/document-editing/server/document-content";
import {
  normalizeCreateTitle,
  normalizeRenameTitle,
} from "@/features/documents/server/document-title";
import type {
  DocumentRecord,
  DocumentRepository,
} from "@/features/documents/server/document-repository-port";
import type {
  DocumentDetail,
  DocumentListResult,
  DocumentSummary,
} from "@/features/documents/types";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/application-errors";

function toSummary(document: DocumentRecord): DocumentSummary {
  return {
    id: document.id,
    title: document.title,
    excerpt: document.contentText,
    version: document.version,
    updatedAt: document.updatedAt.toISOString(),
  };
}

function toDetail(document: DocumentRecord): DocumentDetail {
  return {
    ...toSummary(document),
    contentJson: document.contentJson as JSONContent,
    createdAt: document.createdAt.toISOString(),
    owner: document.owner,
  };
}

async function getAuthorizedDocumentOrThrow(
  repository: DocumentRepository,
  documentId: string,
  viewerId: string,
) {
  const document = await repository.findById(documentId);

  if (!document) {
    throw new NotFoundError("Document not found.");
  }

  if (document.ownerId !== viewerId) {
    throw new ForbiddenError();
  }

  return document;
}

export function createDocumentService(
  repository: DocumentRepository,
) {
  return {
    async createDocument(input: { ownerId: string; title?: string }) {
      const contentJson = createEmptyDocumentContent();
      const document = await repository.create({
        id: crypto.randomUUID(),
        ownerId: input.ownerId,
        title: normalizeCreateTitle(input.title),
        contentJson,
        contentText: "",
      });

      return toDetail(document);
    },

    async listOwnedDocuments(input: {
      ownerId: string;
      limit: number;
      cursor?: string;
    }): Promise<DocumentListResult> {
      const documents = await repository.listOwned({
        ownerId: input.ownerId,
        cursor: input.cursor,
        limit: input.limit + 1,
      });

      const hasMore = documents.length > input.limit;
      const items = hasMore ? documents.slice(0, input.limit) : documents;

      return {
        items: items.map(toSummary),
        nextCursor: hasMore ? items.at(-1)?.id ?? null : null,
      };
    },

    async getOwnedDocument(input: { ownerId: string; documentId: string }) {
      const document = await getAuthorizedDocumentOrThrow(
        repository,
        input.documentId,
        input.ownerId,
      );

      return toDetail(document);
    },

    async renameDocument(input: {
      ownerId: string;
      documentId: string;
      title: string;
    }) {
      await getAuthorizedDocumentOrThrow(
        repository,
        input.documentId,
        input.ownerId,
      );

      const document = await repository.updateTitle({
        id: input.documentId,
        title: normalizeRenameTitle(input.title),
      });

      return toDetail(document);
    },

    async deleteDocument(input: { ownerId: string; documentId: string }) {
      await getAuthorizedDocumentOrThrow(
        repository,
        input.documentId,
        input.ownerId,
      );

      await repository.deleteById(input.documentId);
    },

    async updateDocumentContent(input: {
      ownerId: string;
      documentId: string;
      expectedVersion: number;
      content: unknown;
    }) {
      const currentDocument = await getAuthorizedDocumentOrThrow(
        repository,
        input.documentId,
        input.ownerId,
      );
      const parsedContent = parseDocumentContent(input.content);
      const contentText = documentContentToPlainText(parsedContent);

      const updatedCount = await repository.updateContentIfVersionMatches({
        id: input.documentId,
        ownerId: input.ownerId,
        expectedVersion: input.expectedVersion,
        contentJson: parsedContent,
        contentText,
      });

      if (updatedCount === 0) {
        const latestDocument = await getAuthorizedDocumentOrThrow(
          repository,
          input.documentId,
          input.ownerId,
        );

        throw new ConflictError("A newer version of this document exists.", {
          latestDocument: toDetail(latestDocument),
        });
      }

      const savedDocument = await getAuthorizedDocumentOrThrow(
        repository,
        input.documentId,
        input.ownerId,
      );

      if (savedDocument.version !== currentDocument.version + 1) {
        throw new ConflictError("Document version changed unexpectedly.", {
          latestDocument: toDetail(savedDocument),
        });
      }

      return toDetail(savedDocument);
    },
  };
}
