import type {
  CreateDocumentShareRecordInput,
  CreateDocumentShareResult,
  CreateDocumentRecordInput,
  DocumentRecord,
  DocumentViewerRecord,
  FindDocumentForViewerInput,
  FindShareTargetInput,
  ListEligibleShareUsersInput,
  ListOwnedDocumentRecordsInput,
  ListSharedDocumentRecordsInput,
  ShareTargetRecord,
  UpdateDocumentRecordContentInput,
  UpdateDocumentRecordTitleInput,
} from "@/features/documents/models";
import type { DocumentShareRecord } from "@/features/document-sharing/models";

export interface IDocumentRepository {
  create(input: CreateDocumentRecordInput): Promise<DocumentRecord>;
  listOwned(input: ListOwnedDocumentRecordsInput): Promise<DocumentRecord[]>;
  listShared(input: ListSharedDocumentRecordsInput): Promise<DocumentRecord[]>;
  findById(id: string): Promise<DocumentRecord | null>;
  findByIdForViewer(
    input: FindDocumentForViewerInput,
  ): Promise<DocumentViewerRecord | null>;
  updateTitle(input: UpdateDocumentRecordTitleInput): Promise<DocumentRecord>;
  deleteById(id: string): Promise<void>;
  updateContentIfVersionMatches(
    input: UpdateDocumentRecordContentInput,
  ): Promise<number>;
  listShares(documentId: string): Promise<DocumentShareRecord[]>;
  listEligibleShareUsers(
    input: ListEligibleShareUsersInput,
  ): Promise<ShareTargetRecord[]>;
  findShareTarget(input: FindShareTargetInput): Promise<ShareTargetRecord | null>;
  createShareIfMissing(
    input: CreateDocumentShareRecordInput,
  ): Promise<CreateDocumentShareResult>;
  deleteShare(documentId: string, userId: string): Promise<number>;
}
