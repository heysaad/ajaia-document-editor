import type { JSONContent } from "@tiptap/core";

import type { DocumentDetail } from "@/features/documents/models";

export interface IDocumentSaveClient {
  save(
    documentId: string,
    content: JSONContent,
    expectedVersion: number,
    signal: AbortSignal,
  ): Promise<DocumentDetail>;
}
