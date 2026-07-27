import type { JSONContent } from "@tiptap/core";

import type { DocumentDetail } from "@/features/documents/types";
import { fetchJson } from "@/lib/api-client";

export interface DocumentSaveClientPort {
  save(
    documentId: string,
    content: JSONContent,
    expectedVersion: number,
    signal: AbortSignal,
  ): Promise<DocumentDetail>;
}

export class FetchDocumentSaveClient implements DocumentSaveClientPort {
  save(
    documentId: string,
    content: JSONContent,
    expectedVersion: number,
    signal: AbortSignal,
  ): Promise<DocumentDetail> {
    return fetchJson<DocumentDetail>(`/api/documents/${documentId}/content`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, expectedVersion }),
      signal,
    });
  }
}

export const fetchDocumentSaveClient: DocumentSaveClientPort =
  new FetchDocumentSaveClient();
