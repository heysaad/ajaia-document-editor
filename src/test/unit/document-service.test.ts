import type { JSONContent } from "@tiptap/core";
import { beforeEach, describe, expect, it } from "vitest";

import type {
  CreateDocumentShareRecordInput,
  CreateDocumentShareResult,
  DocumentRecord,
  DocumentViewerRecord,
  FindDocumentForViewerInput,
  FindShareTargetInput,
  DocumentPageRecordsResult,
  ListEligibleShareUsersInput,
  ListOwnedDocumentPageRecordsInput,
  ListOwnedDocumentRecordsInput,
  ListSharedDocumentPageRecordsInput,
  ListSharedDocumentRecordsInput,
  ShareTargetRecord,
  UpdateDocumentRecordContentInput,
  UpdateDocumentRecordTitleInput,
} from "@/features/documents/models";
import { DocumentService } from "@/features/documents/server/DocumentService";
import type { IDocumentRepository } from "@/features/documents/server/IDocumentRepository";
import type { DocumentShareRecord } from "@/features/document-sharing/models";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/application-errors";

const owner = {
  id: "771f2b30-3b0c-40d8-a96f-6c2ded9e70a1",
  name: "Maya Patel",
  email: "maya@example.com",
};
const sharedEditor = {
  id: "49954d99-caf9-4d2d-ba4e-54c56a59f977",
  name: "Jordan Lee",
  email: "jordan@example.com",
};
const unrelatedUser = {
  id: "bb59da17-4c4f-4c6b-a3ec-06a57e7df833",
  name: "Avery Carter",
  email: "avery@example.com",
};
const documentId = "5c301301-2b15-47ec-ae55-b0f3ac3bcf51";
const initialContent: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

function record(overrides: Partial<DocumentRecord> = {}): DocumentRecord {
  return {
    id: documentId,
    ownerId: owner.id,
    owner,
    title: "Draft",
    contentJson: initialContent,
    contentText: "",
    version: 1,
    createdAt: new Date("2026-07-27T10:00:00.000Z"),
    updatedAt: new Date("2026-07-27T10:00:00.000Z"),
    ...overrides,
  };
}

function shareRecord(
  overrides: Partial<DocumentShareRecord> = {},
): DocumentShareRecord {
  return {
    documentId,
    userId: sharedEditor.id,
    role: "EDITOR",
    createdAt: new Date("2026-07-27T10:05:00.000Z"),
    updatedAt: new Date("2026-07-27T10:05:00.000Z"),
    user: sharedEditor,
    ...overrides,
  };
}

class InMemoryDocumentRepository implements IDocumentRepository {
  private readonly documents: Map<string, DocumentRecord>;
  private readonly shares: Map<string, DocumentShareRecord>;
  contentWrites = 0;

  constructor(seedDocuments: DocumentRecord[], seedShares: DocumentShareRecord[] = []) {
    this.documents = new Map(seedDocuments.map((item) => [item.id, item]));
    this.shares = new Map(
      seedShares.map((item) => [`${item.documentId}:${item.userId}`, item]),
    );
  }

  async create(
    input: Parameters<IDocumentRepository["create"]>[0],
  ): Promise<DocumentRecord> {
    const created = record({
      ...input,
      owner,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.documents.set(created.id, created);
    return created;
  }

  async listOwned({ ownerId, limit }: ListOwnedDocumentRecordsInput) {
    return [...this.documents.values()]
      .filter((item) => item.ownerId === ownerId)
      .slice(0, limit);
  }

  async listOwnedPage(
    unusedInput: ListOwnedDocumentPageRecordsInput,
  ): Promise<DocumentPageRecordsResult> {
    void unusedInput;
    return {
      items: [],
      totalItems: 0,
      page: 1,
      pageSize: 1,
    };
  }

  async listShared({ viewerId, limit }: ListSharedDocumentRecordsInput) {
    const sharedDocumentIds = [...this.shares.values()]
      .filter((share) => share.userId === viewerId)
      .map((share) => share.documentId);

    return [...this.documents.values()]
      .filter((item) => sharedDocumentIds.includes(item.id))
      .slice(0, limit);
  }

  async listSharedPage(
    unusedInput: ListSharedDocumentPageRecordsInput,
  ): Promise<DocumentPageRecordsResult> {
    void unusedInput;
    return {
      items: [],
      totalItems: 0,
      page: 1,
      pageSize: 1,
    };
  }

  async findById(id: string) {
    return this.documents.get(id) ?? null;
  }

  async findByIdForViewer({
    documentId: requestedDocumentId,
    viewerId,
  }: FindDocumentForViewerInput): Promise<DocumentViewerRecord | null> {
    const document = this.documents.get(requestedDocumentId);

    if (!document) {
      return null;
    }

    const share = this.shares.get(`${requestedDocumentId}:${viewerId}`);
    return {
      ...document,
      viewerShareRole: share?.role ?? null,
    };
  }

  async updateTitle({ id, title }: UpdateDocumentRecordTitleInput) {
    const current = this.documents.get(id)!;
    const updated = { ...current, title, updatedAt: new Date() };
    this.documents.set(id, updated);
    return updated;
  }

  async deleteById(id: string) {
    this.documents.delete(id);
    for (const key of [...this.shares.keys()]) {
      if (key.startsWith(`${id}:`)) {
        this.shares.delete(key);
      }
    }
  }

  async updateContentIfVersionMatches(input: UpdateDocumentRecordContentInput) {
    const current = this.documents.get(input.id);
    const share = this.shares.get(`${input.id}:${input.viewerId}`);

    if (
      !current ||
      current.version !== input.expectedVersion ||
      (current.ownerId !== input.viewerId && share?.role !== "EDITOR")
    ) {
      return 0;
    }

    this.contentWrites += 1;
    this.documents.set(input.id, {
      ...current,
      contentJson: input.contentJson,
      contentText: input.contentText,
      version: current.version + 1,
      updatedAt: new Date(),
    });
    return 1;
  }

  async listShares(requestedDocumentId: string) {
    return [...this.shares.values()].filter(
      (share) => share.documentId === requestedDocumentId,
    );
  }

  async listEligibleShareUsers(unusedInput: ListEligibleShareUsersInput) {
    void unusedInput;
    return [sharedEditor, unrelatedUser] satisfies ShareTargetRecord[];
  }

  async findShareTarget({ userId, normalizedEmail }: FindShareTargetInput) {
    return [owner, sharedEditor, unrelatedUser].find(
      (candidate) =>
        candidate.id === userId || candidate.email === normalizedEmail,
    ) ?? null;
  }

  async createShareIfMissing(
    input: CreateDocumentShareRecordInput,
  ): Promise<CreateDocumentShareResult> {
    const key = `${input.documentId}:${input.userId}`;
    const existing = this.shares.get(key);
    if (existing) {
      return { share: existing, created: false };
    }

    const target = [owner, sharedEditor, unrelatedUser].find(
      (candidate) => candidate.id === input.userId,
    )!;
    const created = shareRecord({
      documentId: input.documentId,
      userId: input.userId,
      user: target,
      role: input.role,
    });
    this.shares.set(key, created);
    return { share: created, created: true };
  }

  async deleteShare(requestedDocumentId: string, userId: string) {
    const key = `${requestedDocumentId}:${userId}`;
    const existed = this.shares.delete(key);
    return existed ? 1 : 0;
  }

  get(id: string) {
    return this.documents.get(id);
  }
}

describe("document service", () => {
  let repository: InMemoryDocumentRepository;

  beforeEach(() => {
    repository = new InMemoryDocumentRepository([record()], [shareRecord()]);
  });

  it("allows a shared editor to read and save content but not rename or delete", async () => {
    const service = new DocumentService(repository);
    const content: JSONContent = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Shared edit" }],
        },
      ],
    };

    await expect(
      service.getDocumentForViewer({
        viewerId: sharedEditor.id,
        documentId,
      }),
    ).resolves.toMatchObject({ accessRole: "EDITOR" });

    const saved = await service.updateDocumentContent({
      viewerId: sharedEditor.id,
      documentId,
      expectedVersion: 1,
      content,
    });

    expect(saved.version).toBe(2);
    expect(saved.excerpt).toBe("Shared edit");
    await expect(
      service.renameDocument({
        ownerId: sharedEditor.id,
        documentId,
        title: "Nope",
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      service.deleteDocument({
        ownerId: sharedEditor.id,
        documentId,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("hides unrelated documents from non-members", async () => {
    const service = new DocumentService(repository);

    await expect(
      service.getDocumentForViewer({
        viewerId: unrelatedUser.id,
        documentId,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      service.updateDocumentContent({
        viewerId: unrelatedUser.id,
        documentId,
        expectedVersion: 1,
        content: initialContent,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("returns a conflict without overwriting a newer version", async () => {
    repository = new InMemoryDocumentRepository(
      [record({ version: 3 })],
      [shareRecord()],
    );
    const service = new DocumentService(repository);

    await expect(
      service.updateDocumentContent({
        viewerId: owner.id,
        documentId,
        expectedVersion: 2,
        content: initialContent,
      }),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(repository.get(documentId)?.version).toBe(3);
    expect(repository.contentWrites).toBe(0);
  });

  it("does not write invalid content", async () => {
    const service = new DocumentService(repository);

    await expect(
      service.updateDocumentContent({
        viewerId: owner.id,
        documentId,
        expectedVersion: 1,
        content: { type: "doc", content: [{ type: "image" }] },
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(repository.contentWrites).toBe(0);
    expect(repository.get(documentId)?.version).toBe(1);
  });

  it("prevents self-sharing and allows revoke after a valid share", async () => {
    const service = new DocumentService(repository);

    await expect(
      service.grantDocumentShare({
        ownerId: owner.id,
        documentId,
        email: "maya@example.com",
      }),
    ).rejects.toBeInstanceOf(ValidationError);

    const granted = await service.grantDocumentShare({
      ownerId: owner.id,
      documentId,
      userId: unrelatedUser.id,
    });
    expect(granted).toMatchObject({
      created: true,
      share: {
        user: unrelatedUser,
        role: "EDITOR",
      },
    });

    await expect(
      service.revokeDocumentShare({
        ownerId: owner.id,
        documentId,
        userId: unrelatedUser.id,
      }),
    ).resolves.toBeUndefined();
  });
});
