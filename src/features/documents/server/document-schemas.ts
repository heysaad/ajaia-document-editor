import { z } from "zod";

import { DOCUMENT_LIST_PAGE_LIMIT } from "@/features/documents/server/document-constants";

export const createDocumentSchema = z.object({
  title: z.string().max(120).optional(),
});

export const renameDocumentSchema = z.object({
  title: z.string().max(120),
});

export const listDocumentsSearchSchema = z.object({
  ownedCursor: z.string().uuid().optional(),
  sharedCursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(DOCUMENT_LIST_PAGE_LIMIT),
});

export const documentIdParamSchema = z.object({
  documentId: z.string().uuid(),
});

export const updateDocumentContentSchema = z.object({
  expectedVersion: z.number().int().positive(),
  content: z.unknown(),
});
