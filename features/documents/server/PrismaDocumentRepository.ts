import "server-only";

import type { PrismaClient } from "@prisma/client";

import type {
  CreateDocumentRecordInput,
  DocumentRecord,
  ListOwnedDocumentRecordsInput,
  UpdateDocumentRecordContentInput,
  UpdateDocumentRecordTitleInput,
} from "@/features/documents/models";
import type { IDocumentRepository } from "@/features/documents/server/IDocumentRepository";

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

export class PrismaDocumentRepository implements IDocumentRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(input: CreateDocumentRecordInput): Promise<DocumentRecord> {
    const document = await this.db.document.create({
      data: input,
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return mapPrismaDocument(document);
  }

  async listOwned({
    ownerId,
    cursor,
    limit,
  }: ListOwnedDocumentRecordsInput): Promise<DocumentRecord[]> {
    const documents = await this.db.document.findMany({
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
  }

  async findById(id: string): Promise<DocumentRecord | null> {
    const document = await this.db.document.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return document ? mapPrismaDocument(document) : null;
  }

  async updateTitle({
    id,
    title,
  }: UpdateDocumentRecordTitleInput): Promise<DocumentRecord> {
    const document = await this.db.document.update({
      where: { id },
      data: { title },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return mapPrismaDocument(document);
  }

  async deleteById(id: string): Promise<void> {
    await this.db.document.delete({ where: { id } });
  }

  async updateContentIfVersionMatches(
    input: UpdateDocumentRecordContentInput,
  ): Promise<number> {
    const result = await this.db.document.updateMany({
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
  }
}
