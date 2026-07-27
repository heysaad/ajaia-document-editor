import "server-only";

import type { PrismaClient } from "@prisma/client";

import type {
  DocumentRecord,
  DocumentRepository,
} from "@/features/documents/server/document-repository-port";
import { prisma } from "@/infra/db/prisma";

function mapPrismaDocument(record: {
  id: string;
  ownerId: string;
  title: string;
  contentJson: unknown;
  contentText: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  owner: {
    id: string;
    name: string;
    email: string;
  };
}): DocumentRecord {
  return {
    ...record,
    contentJson: record.contentJson as DocumentRecord["contentJson"],
  };
}

function createPrismaDocumentRepository(db: PrismaClient): DocumentRepository {
  return {
    async create(input) {
      const document = await db.document.create({
        data: input,
        include: {
          owner: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return mapPrismaDocument(document);
    },
    async listOwned({ ownerId, cursor, limit }) {
      const documents = await db.document.findMany({
        where: { ownerId },
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        ...(cursor
          ? {
              cursor: { id: cursor },
              skip: 1,
            }
          : {}),
        take: limit,
        include: {
          owner: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return documents.map(mapPrismaDocument);
    },
    async findById(id) {
      const document = await db.document.findUnique({
        where: { id },
        include: {
          owner: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return document ? mapPrismaDocument(document) : null;
    },
    async updateTitle({ id, title }) {
      const document = await db.document.update({
        where: { id },
        data: { title },
        include: {
          owner: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return mapPrismaDocument(document);
    },
    async deleteById(id) {
      await db.document.delete({ where: { id } });
    },
    async updateContentIfVersionMatches(input) {
      const result = await db.document.updateMany({
        where: {
          id: input.id,
          ownerId: input.ownerId,
          version: input.expectedVersion,
        },
        data: {
          contentJson: input.contentJson,
          contentText: input.contentText,
          version: { increment: 1 },
        },
      });

      return result.count;
    },
  };
}

export const documentRepository = createPrismaDocumentRepository(prisma);
