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

export interface ListOwnedDocumentsInput {
  ownerId: string;
  cursor?: string;
  limit: number;
}

export interface UpdateDocumentTitleInput {
  id: string;
  title: string;
}

export interface UpdateDocumentContentInput {
  id: string;
  ownerId: string;
  expectedVersion: number;
  contentJson: JSONContent;
  contentText: string;
}

export interface DocumentRepositoryPort {
  create(input: CreateDocumentRecordInput): Promise<DocumentRecord>;
  listOwned(input: ListOwnedDocumentsInput): Promise<DocumentRecord[]>;
  findById(id: string): Promise<DocumentRecord | null>;
  updateTitle(input: UpdateDocumentTitleInput): Promise<DocumentRecord>;
  deleteById(id: string): Promise<void>;
  updateContentIfVersionMatches(
    input: UpdateDocumentContentInput,
  ): Promise<number>;
}
