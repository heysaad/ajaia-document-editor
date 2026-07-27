import "server-only";

import { documentRepository } from "@/features/documents/server/document-prisma-repository";
import { createDocumentService } from "@/features/documents/server/document-service";

export const documentService = createDocumentService(documentRepository);
