import "server-only";
import "reflect-metadata";

import { container, instanceCachingFactory } from "tsyringe";

import { env } from "@/config/env";
import {
  createAuth,
  type AuthInstance,
} from "@/features/auth/server/auth-factory";
import { DocumentService } from "@/features/documents/server/DocumentService";
import { PrismaDocumentRepository } from "@/features/documents/server/PrismaDocumentRepository";
import { prisma } from "@/infra/db/prisma";
import { DI_TOKENS, type DiTokens } from "@/infra/di/tokens";

type AppContainer = {
  resolve<K extends keyof DiTokens>(token: K): DiTokens[K];
};

type GlobalDiState = {
  appContainer?: AppContainer;
  appContainerConfigured?: boolean;
};

const globalForDi = globalThis as GlobalDiState;
const appContainer = globalForDi.appContainer ?? (container as AppContainer);

function registerCoreDependencies() {
  if (globalForDi.appContainerConfigured) {
    return;
  }

  if (!container.isRegistered(DI_TOKENS.PrismaClient, true)) {
    container.register(DI_TOKENS.PrismaClient, {
      useValue: prisma,
    });
  }

  if (!container.isRegistered(DI_TOKENS.Auth, true)) {
    container.register<AuthInstance>(DI_TOKENS.Auth, {
      useFactory: instanceCachingFactory((scopedContainer) =>
        createAuth({
          prisma: scopedContainer.resolve(DI_TOKENS.PrismaClient),
          secret: env.BETTER_AUTH_SECRET,
          baseURL: env.BETTER_AUTH_URL,
        }),
      ),
    });
  }

  if (!container.isRegistered(DI_TOKENS.DocumentRepository, true)) {
    container.register(DI_TOKENS.DocumentRepository, {
      useFactory: instanceCachingFactory(
        (scopedContainer) =>
          new PrismaDocumentRepository(
            scopedContainer.resolve(DI_TOKENS.PrismaClient),
          ),
      ),
    });
  }

  if (!container.isRegistered(DI_TOKENS.DocumentService, true)) {
    container.register(DI_TOKENS.DocumentService, {
      useFactory: instanceCachingFactory(
        (scopedContainer) =>
          new DocumentService(
            scopedContainer.resolve(DI_TOKENS.DocumentRepository),
          ),
      ),
    });
  }

  globalForDi.appContainerConfigured = true;
}

registerCoreDependencies();

if (env.NODE_ENV !== "production") {
  globalForDi.appContainer = appContainer;
}

export { appContainer };
