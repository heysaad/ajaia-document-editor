import type { JSONContent } from "@tiptap/core";

export interface DocumentOwnerRecord {
  id: string;
  name: string;
  email: string;
}

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

export interface UpdateDocumentRecordTitleInput {
  id: string;
  title: string;
}

export interface UpdateDocumentRecordContentInput {
  id: string;
  ownerId: string;
  expectedVersion: number;
  contentJson: JSONContent;
  contentText: string;
}

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

export interface DocumentSummary {
  id: string;
  title: string;
  excerpt: string;
  version: number;
  updatedAt: string;
}

export interface DocumentListResult {
  items: DocumentSummary[];
  nextCursor: string | null;
}

export interface DocumentDetail extends DocumentSummary {
  contentJson: JSONContent;
  createdAt: string;
  owner: DocumentOwnerRecord;
}
