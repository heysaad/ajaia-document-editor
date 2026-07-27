import "server-only";

import { DocumentService } from "@/features/documents/server/DocumentService";
import type { IDocumentService } from "@/features/documents/server/IDocumentService";
import { PrismaDocumentRepository } from "@/features/documents/server/PrismaDocumentRepository";
import { prisma } from "@/infra/db/prisma";

const documentRepository = new PrismaDocumentRepository(prisma);

export const documentService: IDocumentService = new DocumentService(
  documentRepository,
);
