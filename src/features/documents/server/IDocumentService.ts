import type {
  CreateDocumentInput,
  DeleteDocumentInput,
  DocumentDashboardData,
  DocumentDetail,
  DocumentListResult,
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
import type {
  DocumentShareListResult,
  EligibleShareUsersResult,
  GrantDocumentShareResult,
} from "@/features/document-sharing/models";

export interface IDocumentService {
  createDocument(input: CreateDocumentInput): Promise<DocumentDetail>;
  importDocument(input: ImportDocumentInput): Promise<DocumentDetail>;
  listDashboardDocuments(
    input: ListDashboardDocumentsInput,
  ): Promise<DocumentDashboardData>;
  listOwnedDocuments(
    input: ListOwnedDocumentsInput,
  ): Promise<DocumentListResult>;
  getDocumentForViewer(
    input: GetDocumentForViewerInput,
  ): Promise<DocumentDetail>;
  getOwnedDocument(input: GetOwnedDocumentInput): Promise<DocumentDetail>;
  renameDocument(input: RenameDocumentInput): Promise<DocumentDetail>;
  deleteDocument(input: DeleteDocumentInput): Promise<void>;
  updateDocumentContent(
    input: UpdateDocumentContentInput,
  ): Promise<DocumentDetail>;
  listDocumentShares(
    input: ListDocumentSharesInput,
  ): Promise<DocumentShareListResult>;
  listEligibleShareUsers(
    input: ListEligibleShareUsersRequest,
  ): Promise<EligibleShareUsersResult>;
  grantDocumentShare(
    input: GrantDocumentShareInput,
  ): Promise<GrantDocumentShareResult>;
  revokeDocumentShare(input: RevokeDocumentShareInput): Promise<void>;
}
