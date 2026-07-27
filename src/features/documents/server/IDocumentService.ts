import type {
  CreateDocumentInput,
  DeleteDocumentInput,
  DocumentDetail,
  DocumentListResult,
  GetOwnedDocumentInput,
  ImportDocumentInput,
  ListOwnedDocumentsInput,
  RenameDocumentInput,
  UpdateDocumentContentInput,
} from "@/features/documents/models";

export interface IDocumentService {
  createDocument(input: CreateDocumentInput): Promise<DocumentDetail>;
  importDocument(input: ImportDocumentInput): Promise<DocumentDetail>;
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
