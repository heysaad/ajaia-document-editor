import type { JSONContent } from "@tiptap/core";

export type DocumentSummary = {
  id: string;
  title: string;
  excerpt: string;
  version: number;
  updatedAt: string;
};

export type DocumentListResult = {
  items: DocumentSummary[];
  nextCursor: string | null;
};

export type DocumentDetail = DocumentSummary & {
  contentJson: JSONContent;
  createdAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
};
