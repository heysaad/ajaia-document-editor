import type {
  DocumentDetail,
  DocumentListResult,
} from "@/features/documents/types";

export interface CreateDocumentInput {
  ownerId: string;
  title?: string;
}

export interface ListOwnedDocumentsInput {
  ownerId: string;
  limit: number;
  cursor?: string;
}

export interface GetOwnedDocumentInput {
  ownerId: string;
  documentId: string;
}

export interface RenameDocumentInput {
  ownerId: string;
  documentId: string;
  title: string;
}

export interface DeleteDocumentInput {
  ownerId: string;
  documentId: string;
}

export interface UpdateDocumentContentInput {
  ownerId: string;
  documentId: string;
  expectedVersion: number;
  content: unknown;
}

export interface DocumentServicePort {
  createDocument(input: CreateDocumentInput): Promise<DocumentDetail>;
  listOwnedDocuments(
    input: ListOwnedDocumentsInput,
  ): Promise<DocumentListResult>;
  getOwnedDocument(input: GetOwnedDocumentInput): Promise<DocumentDetail>;
  renameDocument(input: RenameDocumentInput): Promise<DocumentDetail>;
  deleteDocument(input: DeleteDocumentInput): Promise<void>;
  updateDocumentContent(
    input: UpdateDocumentContentInput,
  ): Promise<DocumentDetail>;
}
