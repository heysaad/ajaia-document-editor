import type { JSONContent } from "@tiptap/core";

export type DocumentOwnerRecord = {
  id: string;
  name: string;
  email: string;
};

export type DocumentRecord = {
  id: string;
  ownerId: string;
  title: string;
  contentJson: JSONContent;
  contentText: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  owner: DocumentOwnerRecord;
};

export type DocumentRepository = {
  create(input: {
    id: string;
    ownerId: string;
    title: string;
    contentJson: JSONContent;
    contentText: string;
  }): Promise<DocumentRecord>;
  listOwned(input: {
    ownerId: string;
    cursor?: string;
    limit: number;
  }): Promise<DocumentRecord[]>;
  findById(id: string): Promise<DocumentRecord | null>;
  updateTitle(input: { id: string; title: string }): Promise<DocumentRecord>;
  deleteById(id: string): Promise<void>;
  updateContentIfVersionMatches(input: {
    id: string;
    ownerId: string;
    expectedVersion: number;
    contentJson: JSONContent;
    contentText: string;
  }): Promise<number>;
};
