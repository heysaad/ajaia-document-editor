import type { JSONContent } from "@tiptap/core";

import {
  convertImportedDocument,
} from "@/features/document-import/server/import-document";
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
  CreateDocumentInput,
  DeleteDocumentInput,
  DocumentDetail,
  DocumentListResult,
  DocumentRecord,
  DocumentSummary,
  GetOwnedDocumentInput,
  ImportDocumentInput,
  ListOwnedDocumentsInput,
  RenameDocumentInput,
  UpdateDocumentContentInput,
} from "@/features/documents/models";
import type { IDocumentRepository } from "@/features/documents/server/IDocumentRepository";
import type { IDocumentService } from "@/features/documents/server/IDocumentService";
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
  repository: IDocumentRepository,
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

    return toDetail(document);
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

    return toDetail(document);
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
      items: items.map(toSummary),
      nextCursor: hasMore ? items.at(-1)?.id ?? null : null,
    };
  }

  async getOwnedDocument(input: GetOwnedDocumentInput): Promise<DocumentDetail> {
    const document = await getAuthorizedDocumentOrThrow(
      this.repository,
      input.documentId,
      input.ownerId,
    );

    return toDetail(document);
  }

  async renameDocument(input: RenameDocumentInput): Promise<DocumentDetail> {
    await getAuthorizedDocumentOrThrow(
      this.repository,
      input.documentId,
      input.ownerId,
    );

    const document = await this.repository.updateTitle({
      id: input.documentId,
      title: normalizeRenameTitle(input.title),
    });

    return toDetail(document);
  }

  async deleteDocument(input: DeleteDocumentInput): Promise<void> {
    await getAuthorizedDocumentOrThrow(
      this.repository,
      input.documentId,
      input.ownerId,
    );

    await this.repository.deleteById(input.documentId);
  }

  async updateDocumentContent(
    input: UpdateDocumentContentInput,
  ): Promise<DocumentDetail> {
    const currentDocument = await getAuthorizedDocumentOrThrow(
      this.repository,
      input.documentId,
      input.ownerId,
    );
    const parsedContent = parseDocumentContent(input.content);
    const contentText = documentContentToPlainText(parsedContent);

    const updatedCount = await this.repository.updateContentIfVersionMatches({
      id: input.documentId,
      ownerId: input.ownerId,
      expectedVersion: input.expectedVersion,
      contentJson: parsedContent,
      contentText,
    });

    if (updatedCount === 0) {
      const latestDocument = await getAuthorizedDocumentOrThrow(
        this.repository,
        input.documentId,
        input.ownerId,
      );

      throw new ConflictError("A newer version of this document exists.", {
        latestDocument: toDetail(latestDocument),
      });
    }

    const savedDocument = await getAuthorizedDocumentOrThrow(
      this.repository,
      input.documentId,
      input.ownerId,
    );

    if (savedDocument.version !== currentDocument.version + 1) {
      throw new ConflictError("Document version changed unexpectedly.", {
        latestDocument: toDetail(savedDocument),
      });
    }

    return toDetail(savedDocument);
  }
}
