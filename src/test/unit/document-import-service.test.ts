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
  ListSharedDocumentRecordsInput,
  ListSharedDocumentPageRecordsInput,
  ShareTargetRecord,
} from "@/features/documents/models";
import { DocumentService } from "@/features/documents/server/DocumentService";
import type { IDocumentRepository } from "@/features/documents/server/IDocumentRepository";
import type { DocumentShareRecord } from "@/features/document-sharing/models";

const owner = {
  id: "771f2b30-3b0c-40d8-a96f-6c2ded9e70a1",
  name: "Maya Patel",
  email: "maya@example.com",
};

const emptyContent: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

function seededDocument(overrides: Partial<DocumentRecord> = {}): DocumentRecord {
  return {
    id: "5c301301-2b15-47ec-ae55-b0f3ac3bcf51",
    ownerId: owner.id,
    owner,
    title: "Existing",
    contentJson: emptyContent,
    contentText: "",
    version: 1,
    createdAt: new Date("2026-07-27T10:00:00.000Z"),
    updatedAt: new Date("2026-07-27T10:00:00.000Z"),
    ...overrides,
  };
}

class InMemoryDocumentRepository implements IDocumentRepository {
  private readonly documents = new Map<string, DocumentRecord>();

  constructor(seed: DocumentRecord[]) {
    for (const document of seed) {
      this.documents.set(document.id, document);
    }
  }

  async create(
    input: Parameters<IDocumentRepository["create"]>[0],
  ): Promise<DocumentRecord> {
    const created: DocumentRecord = {
      ...seededDocument(),
      ...input,
      owner,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.documents.set(created.id, created);
    return created;
  }

  async listOwned() {
    return [];
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

  async listShared(unusedInput: ListSharedDocumentRecordsInput) {
    void unusedInput;
    return [];
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
    documentId,
  }: FindDocumentForViewerInput): Promise<DocumentViewerRecord | null> {
    const document = this.documents.get(documentId);

    if (!document) {
      return null;
    }

    return {
      ...document,
      viewerShareRole: null,
    };
  }

  async updateTitle() {
    return this.documents.values().next().value as DocumentRecord;
  }

  async deleteById() {
    throw new Error("Not implemented in this test.");
  }

  async updateContentIfVersionMatches() {
    return 0;
  }

  async listShares(): Promise<DocumentShareRecord[]> {
    return [];
  }

  async listEligibleShareUsers(
    unusedInput: ListEligibleShareUsersInput,
  ): Promise<ShareTargetRecord[]> {
    void unusedInput;
    return [];
  }

  async findShareTarget(
    unusedInput: FindShareTargetInput,
  ): Promise<ShareTargetRecord | null> {
    void unusedInput;
    return null;
  }

  async createShareIfMissing(
    unusedInput: CreateDocumentShareRecordInput,
  ): Promise<CreateDocumentShareResult> {
    void unusedInput;
    throw new Error("Not implemented in this test.");
  }

  async deleteShare() {
    return 0;
  }

  count() {
    return this.documents.size;
  }
}

describe("document import service", () => {
  let repository: InMemoryDocumentRepository;

  beforeEach(() => {
    repository = new InMemoryDocumentRepository([seededDocument()]);
  });

  it("creates a new document from valid markdown without mutating the upload", async () => {
    const service = new DocumentService(repository);
    const source = new TextEncoder().encode("# Review\n\nImported **bold** text.");

    const document = await service.importDocument({
      ownerId: owner.id,
      fileName: "Review Notes.md",
      mimeType: "text/markdown",
      fileSize: source.byteLength,
      fileContent: source,
    });

    expect(document.title).toBe("Review Notes");
    expect(document.excerpt).toBe("Review\nImported bold text.");
    expect(document.contentJson).toEqual({
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "Review" }],
        },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Imported " },
            { type: "text", text: "bold", marks: [{ type: "bold" }] },
            { type: "text", text: " text." },
          ],
        },
      ],
    });
    expect(repository.count()).toBe(2);
  });

  it("rejects invalid imports without creating a partial document", async () => {
    const service = new DocumentService(repository);
    const binaryishSource = new Uint8Array([0x00, 0x48, 0x49]);

    await expect(
      service.importDocument({
        ownerId: owner.id,
        fileName: "bad.md",
        mimeType: "text/markdown",
        fileSize: binaryishSource.byteLength,
        fileContent: binaryishSource,
      }),
    ).rejects.toMatchObject({
      code: "validation_error",
      details: {
        field: "file",
        reason: "unsupported_content",
      },
    });
    expect(repository.count()).toBe(1);
  });

  it("rejects a misleading text extension with binary MIME", async () => {
    const service = new DocumentService(repository);
    const source = new TextEncoder().encode("plain text");

    await expect(
      service.importDocument({
        ownerId: owner.id,
        fileName: "notes.txt",
        mimeType: "application/octet-stream",
        fileSize: source.byteLength,
        fileContent: source,
      }),
    ).rejects.toMatchObject({
      code: "validation_error",
      details: {
        field: "file",
        reason: "unsupported_mime_type",
      },
    });
    expect(repository.count()).toBe(1);
  });
});
