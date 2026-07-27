import type { JSONContent } from "@tiptap/core";

import type {
  DocumentShareRecord,
  DocumentShareRole,
  ShareTargetRecord,
} from "@/features/document-sharing/models";
export type { ShareTargetRecord } from "@/features/document-sharing/models";

export interface DocumentOwnerRecord {
  id: string;
  name: string;
  email: string;
}

export type DocumentAccessRole = "OWNER" | "EDITOR";

export interface DocumentRecord {
  id: string;
  ownerId: string;
  title: string;
  contentJson: JSONContent;
  contentText: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  owner: DocumentOwnerRecord;
}

export interface DocumentViewerRecord extends DocumentRecord {
  viewerShareRole: DocumentShareRole | null;
}

export interface CreateDocumentRecordInput {
  id: string;
  ownerId: string;
  title: string;
  contentJson: JSONContent;
  contentText: string;
}

export interface ListOwnedDocumentRecordsInput {
  ownerId: string;
  cursor?: string;
  limit: number;
}

export interface ListSharedDocumentRecordsInput {
  viewerId: string;
  cursor?: string;
  limit: number;
}

export interface FindDocumentForViewerInput {
  documentId: string;
  viewerId: string;
}

export interface UpdateDocumentRecordTitleInput {
  id: string;
  title: string;
}

export interface UpdateDocumentRecordContentInput {
  id: string;
  viewerId: string;
  expectedVersion: number;
  contentJson: JSONContent;
  contentText: string;
}

export interface ListEligibleShareUsersInput {
  documentId: string;
  ownerId: string;
  query: string;
  limit: number;
}

export interface FindShareTargetInput {
  userId?: string;
  normalizedEmail?: string;
}

export interface CreateDocumentShareRecordInput {
  documentId: string;
  userId: string;
  role: DocumentShareRole;
}

export interface CreateDocumentInput {
  ownerId: string;
  title?: string;
}

export interface ImportDocumentInput {
  ownerId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  fileContent: Uint8Array;
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
  viewerId: string;
  documentId: string;
  expectedVersion: number;
  content: unknown;
}

export interface ListDashboardDocumentsInput {
  viewerId: string;
  pageSize: number;
  ownedPage?: number;
  sharedPage?: number;
}

export interface GetDocumentForViewerInput {
  viewerId: string;
  documentId: string;
}

export interface ListDocumentSharesInput {
  ownerId: string;
  documentId: string;
}

export interface ListEligibleShareUsersRequest {
  ownerId: string;
  documentId: string;
  query: string;
  limit: number;
}

export interface GrantDocumentShareInput {
  ownerId: string;
  documentId: string;
  userId?: string;
  email?: string;
}

export interface RevokeDocumentShareInput {
  ownerId: string;
  documentId: string;
  userId: string;
}

export interface DocumentSummary {
  id: string;
  title: string;
  excerpt: string;
  version: number;
  updatedAt: string;
}

export interface DashboardDocumentSummary extends DocumentSummary {
  accessRole: DocumentAccessRole;
  owner: DocumentOwnerRecord;
}

export interface DocumentListResult {
  items: DocumentSummary[];
  nextCursor: string | null;
}

export interface DocumentPaginationInfo {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface DashboardDocumentListResult {
  items: DashboardDocumentSummary[];
  pagination: DocumentPaginationInfo;
}

export interface DocumentPageRecordsResult {
  items: DocumentRecord[];
  totalItems: number;
  page: number;
  pageSize: number;
}

export interface ListOwnedDocumentPageRecordsInput {
  ownerId: string;
  page: number;
  pageSize: number;
}

export interface ListSharedDocumentPageRecordsInput {
  viewerId: string;
  page: number;
  pageSize: number;
}

export interface DocumentDashboardData {
  owned: DashboardDocumentListResult;
  shared: DashboardDocumentListResult;
}

export interface DocumentDetail extends DocumentSummary {
  contentJson: JSONContent;
  createdAt: string;
  owner: DocumentOwnerRecord;
  accessRole: DocumentAccessRole;
}

export interface CreateDocumentShareResult {
  share: DocumentShareRecord;
  created: boolean;
}

export interface DocumentShareRepositoryPort {
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
