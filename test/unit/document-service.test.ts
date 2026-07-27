import type { JSONContent } from "@tiptap/core";
import { beforeEach, describe, expect, it } from "vitest";

import type {
  DocumentRecord,
  DocumentRepositoryPort,
} from "@/features/documents/server/document-repository-port";
import { DocumentService } from "@/features/documents/server/document-service";
import {
  ConflictError,
  ForbiddenError,
  ValidationError,
} from "@/lib/application-errors";

const owner = {
  id: "771f2b30-3b0c-40d8-a96f-6c2ded9e70a1",
  name: "Maya Patel",
  email: "maya@example.com",
};
const otherUserId = "49954d99-caf9-4d2d-ba4e-54c56a59f977";
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

class InMemoryDocumentRepository implements DocumentRepositoryPort {
  private readonly documents: Map<string, DocumentRecord>;
  contentWrites = 0;

  constructor(seed: DocumentRecord[]) {
    this.documents = new Map(seed.map((item) => [item.id, item]));
  }

  async create(
    input: Parameters<DocumentRepositoryPort["create"]>[0],
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

  async listOwned({
    ownerId,
    limit,
  }: Parameters<DocumentRepositoryPort["listOwned"]>[0]) {
    return [...this.documents.values()]
      .filter((item) => item.ownerId === ownerId)
      .slice(0, limit);
  }

  async findById(id: string) {
    return this.documents.get(id) ?? null;
  }

  async updateTitle({
    id,
    title,
  }: Parameters<DocumentRepositoryPort["updateTitle"]>[0]) {
    const current = this.documents.get(id)!;
    const updated = { ...current, title, updatedAt: new Date() };
    this.documents.set(id, updated);
    return updated;
  }

  async deleteById(id: string) {
    this.documents.delete(id);
  }

  async updateContentIfVersionMatches(
    input: Parameters<
      DocumentRepositoryPort["updateContentIfVersionMatches"]
    >[0],
  ) {
    const current = this.documents.get(input.id);
    if (
      !current ||
      current.ownerId !== input.ownerId ||
      current.version !== input.expectedVersion
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

  get(id: string) {
    return this.documents.get(id);
  }
}

describe("document service", () => {
  let repository: InMemoryDocumentRepository;

  beforeEach(() => {
    repository = new InMemoryDocumentRepository([record()]);
  });

  it("enforces ownership for reads, renames, and deletes", async () => {
    const service = new DocumentService(repository);

    await expect(
      service.getOwnedDocument({ ownerId: otherUserId, documentId }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      service.renameDocument({
        ownerId: otherUserId,
        documentId,
        title: "Stolen",
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      service.deleteDocument({ ownerId: otherUserId, documentId }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(repository.get(documentId)?.title).toBe("Draft");
  });

  it("increments the version exactly once for a valid content save", async () => {
    const service = new DocumentService(repository);
    const content: JSONContent = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Saved once" }],
        },
      ],
    };

    const saved = await service.updateDocumentContent({
      ownerId: owner.id,
      documentId,
      expectedVersion: 1,
      content,
    });

    expect(saved.version).toBe(2);
    expect(saved.excerpt).toBe("Saved once");
    expect(repository.contentWrites).toBe(1);
  });

  it("returns a conflict without overwriting a newer version", async () => {
    repository = new InMemoryDocumentRepository([record({ version: 3 })]);
    const service = new DocumentService(repository);

    await expect(
      service.updateDocumentContent({
        ownerId: owner.id,
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
        ownerId: owner.id,
        documentId,
        expectedVersion: 1,
        content: { type: "doc", content: [{ type: "image" }] },
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(repository.contentWrites).toBe(0);
    expect(repository.get(documentId)?.version).toBe(1);
  });
});
