import type { JSONContent } from "@tiptap/core";

import type { IDocumentSaveClient } from "@/features/document-editing/client/IDocumentSaveClient";
import type { DocumentDetail } from "@/features/documents/models";
import { fetchJson } from "@/lib/api-client";

export class FetchDocumentSaveClient implements IDocumentSaveClient {
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

export const fetchDocumentSaveClient: IDocumentSaveClient =
  new FetchDocumentSaveClient();
