import type { PrismaClient } from "@prisma/client";

import type { IDocumentRepository } from "@/features/documents/server/IDocumentRepository";
import type { IDocumentService } from "@/features/documents/server/IDocumentService";
import type { AuthInstance } from "@/features/auth/server/auth-factory";

export const DI_TOKENS = {
  PrismaClient: "infra.prisma-client",
  Auth: "features.auth.instance",
  DocumentRepository: "features.documents.repository",
  DocumentService: "features.documents.service",
} as const;

export type DiTokens = {
  [DI_TOKENS.PrismaClient]: PrismaClient;
  [DI_TOKENS.Auth]: AuthInstance;
  [DI_TOKENS.DocumentRepository]: IDocumentRepository;
  [DI_TOKENS.DocumentService]: IDocumentService;
};
