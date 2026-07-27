import "server-only";

import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import {
  type DocumentShareRole,
  type PrismaClient,
} from "@prisma/client";

import type {
  CreateDocumentShareRecordInput,
  CreateDocumentShareResult,
  CreateDocumentRecordInput,
  DocumentRecord,
  DocumentViewerRecord,
  FindDocumentForViewerInput,
  FindShareTargetInput,
  ListEligibleShareUsersInput,
  ListOwnedDocumentRecordsInput,
  ListSharedDocumentRecordsInput,
  ShareTargetRecord,
  UpdateDocumentRecordContentInput,
  UpdateDocumentRecordTitleInput,
} from "@/features/documents/models";
import type { DocumentShareRecord } from "@/features/document-sharing/models";
import type { IDocumentRepository } from "@/features/documents/server/IDocumentRepository";
import { SEEDED_USERS } from "@/features/auth/server/seeded-users";

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

function mapPrismaViewerDocument(record: {
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
  shares: Array<{
    role: DocumentShareRole;
  }>;
}): DocumentViewerRecord {
  return {
    ...mapPrismaDocument(record),
    viewerShareRole: record.shares[0]?.role ?? null,
  };
}

function mapPrismaShare(record: {
  documentId: string;
  userId: string;
  role: DocumentShareRole;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
  };
}): DocumentShareRecord {
  return {
    ...record,
    role: record.role,
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

  async listShared({
    viewerId,
    cursor,
    limit,
  }: ListSharedDocumentRecordsInput): Promise<DocumentRecord[]> {
    const documents = await this.db.document.findMany({
      where: {
        shares: {
          some: {
            userId: viewerId,
            role: "EDITOR",
          },
        },
      },
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

  async findByIdForViewer({
    documentId,
    viewerId,
  }: FindDocumentForViewerInput): Promise<DocumentViewerRecord | null> {
    const document = await this.db.document.findUnique({
      where: { id: documentId },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        shares: {
          where: { userId: viewerId },
          select: { role: true },
          take: 1,
        },
      },
    });

    return document ? mapPrismaViewerDocument(document) : null;
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
        version: input.expectedVersion,
        OR: [
          { ownerId: input.viewerId },
          {
            shares: {
              some: {
                userId: input.viewerId,
                role: "EDITOR",
              },
            },
          },
        ],
      },
      data: {
        contentJson: input.contentJson,
        contentText: input.contentText,
        version: { increment: 1 },
      },
    });

    return result.count;
  }

  async listShares(documentId: string): Promise<DocumentShareRecord[]> {
    const shares = await this.db.documentShare.findMany({
      where: { documentId },
      orderBy: [{ createdAt: "asc" }, { userId: "asc" }],
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return shares.map(mapPrismaShare);
  }

  async listEligibleShareUsers({
    documentId,
    ownerId,
  }: ListEligibleShareUsersInput): Promise<ShareTargetRecord[]> {
    return this.db.user.findMany({
      where: {
        id: { not: ownerId },
        email: { in: SEEDED_USERS.map((user) => user.email) },
        documentShares: {
          none: { documentId },
        },
      },
      orderBy: [{ name: "asc" }, { email: "asc" }],
      select: { id: true, name: true, email: true },
    });
  }

  async findShareTarget({
    userId,
    normalizedEmail,
  }: FindShareTargetInput): Promise<ShareTargetRecord | null> {
    const target = await this.db.user.findFirst({
      where: {
        email: { in: SEEDED_USERS.map((user) => user.email) },
        OR: [
          ...(userId ? [{ id: userId }] : []),
          ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
        ],
      },
      select: { id: true, name: true, email: true },
    });

    return target;
  }

  async createShareIfMissing(
    input: CreateDocumentShareRecordInput,
  ): Promise<CreateDocumentShareResult> {
    const existing = await this.db.documentShare.findUnique({
      where: {
        documentId_userId: {
          documentId: input.documentId,
          userId: input.userId,
        },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (existing) {
      return {
        share: mapPrismaShare(existing),
        created: false,
      };
    }

    try {
      const created = await this.db.documentShare.create({
        data: input,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return {
        share: mapPrismaShare(created),
        created: true,
      };
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const share = await this.db.documentShare.findUniqueOrThrow({
          where: {
            documentId_userId: {
              documentId: input.documentId,
              userId: input.userId,
            },
          },
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        });

        return {
          share: mapPrismaShare(share),
          created: false,
        };
      }

      throw error;
    }
  }

  async deleteShare(documentId: string, userId: string): Promise<number> {
    const result = await this.db.documentShare.deleteMany({
      where: { documentId, userId },
    });

    return result.count;
  }
}
