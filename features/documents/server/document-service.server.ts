import "server-only";

import { PrismaDocumentRepository } from "@/features/documents/server/document-prisma-repository";
import { DocumentService } from "@/features/documents/server/document-service";
import type { DocumentServicePort } from "@/features/documents/server/document-service-port";
import { prisma } from "@/infra/db/prisma";

const documentRepository = new PrismaDocumentRepository(prisma);

export const documentService: DocumentServicePort = new DocumentService(
  documentRepository,
);
