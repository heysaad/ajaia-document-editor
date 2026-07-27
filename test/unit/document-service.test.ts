import type { JSONContent } from "@tiptap/core";
import { beforeEach, describe, expect, it } from "vitest";

import type {
  DocumentRecord,
  DocumentRepository,
} from "@/features/documents/server/document-repository-port";
import { createDocumentService } from "@/features/documents/server/document-service";
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

function createMemoryRepository(seed: DocumentRecord[]) {
  const documents = new Map(seed.map((item) => [item.id, item]));
  let contentWrites = 0;

  const repository: DocumentRepository = {
    async create(input) {
      const created = record({
        ...input,
        owner,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      documents.set(created.id, created);
      return created;
    },
    async listOwned({ ownerId, limit }) {
      return [...documents.values()]
        .filter((item) => item.ownerId === ownerId)
        .slice(0, limit);
    },
    async findById(id) {
      return documents.get(id) ?? null;
    },
    async updateTitle({ id, title }) {
      const current = documents.get(id)!;
      const updated = { ...current, title, updatedAt: new Date() };
      documents.set(id, updated);
      return updated;
    },
    async deleteById(id) {
      documents.delete(id);
    },
    async updateContentIfVersionMatches(input) {
      const current = documents.get(input.id);
      if (
        !current ||
        current.ownerId !== input.ownerId ||
        current.version !== input.expectedVersion
      ) {
        return 0;
      }
      contentWrites += 1;
      documents.set(input.id, {
        ...current,
        contentJson: input.contentJson,
        contentText: input.contentText,
        version: current.version + 1,
        updatedAt: new Date(),
      });
      return 1;
    },
  };

  return {
    repository,
    get: (id: string) => documents.get(id),
    get contentWrites() {
      return contentWrites;
    },
  };
}

describe("document service", () => {
  let memory: ReturnType<typeof createMemoryRepository>;

  beforeEach(() => {
    memory = createMemoryRepository([record()]);
  });

  it("enforces ownership for reads, renames, and deletes", async () => {
    const service = createDocumentService(memory.repository);

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
    expect(memory.get(documentId)?.title).toBe("Draft");
  });

  it("increments the version exactly once for a valid content save", async () => {
    const service = createDocumentService(memory.repository);
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
    expect(memory.contentWrites).toBe(1);
  });

  it("returns a conflict without overwriting a newer version", async () => {
    memory = createMemoryRepository([record({ version: 3 })]);
    const service = createDocumentService(memory.repository);

    await expect(
      service.updateDocumentContent({
        ownerId: owner.id,
        documentId,
        expectedVersion: 2,
        content: initialContent,
      }),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(memory.get(documentId)?.version).toBe(3);
    expect(memory.contentWrites).toBe(0);
  });

  it("does not write invalid content", async () => {
    const service = createDocumentService(memory.repository);

    await expect(
      service.updateDocumentContent({
        ownerId: owner.id,
        documentId,
        expectedVersion: 1,
        content: { type: "doc", content: [{ type: "image" }] },
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(memory.contentWrites).toBe(0);
    expect(memory.get(documentId)?.version).toBe(1);
  });
});
