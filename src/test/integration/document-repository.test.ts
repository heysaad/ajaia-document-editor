import type { JSONContent } from "@tiptap/core";
import { PrismaClient } from "@prisma/client";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { PrismaDocumentRepository } from "@/features/documents/server/PrismaDocumentRepository";

const prisma = new PrismaClient();
const repository = new PrismaDocumentRepository(prisma);
const ownerId = "20bdfe9a-3614-481b-8610-4b07c5f2192d";
const otherOwnerId = "8f81f1bf-d02e-4c9d-a35e-a2e758e49465";
const sharedEditorId = "7a2f17ca-cc1e-42b8-ad9a-3344d9dc4352";
const emptyContent: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

describe("PrismaDocumentRepository", () => {
  beforeAll(async () => {
    await prisma.user.createMany({
      data: [
        { id: ownerId, name: "Repository Owner", email: "repo-owner@example.com" },
        {
          id: otherOwnerId,
          name: "Other Owner",
          email: "repo-other@example.com",
        },
        {
          id: sharedEditorId,
          name: "Shared Editor",
          email: "repo-editor@example.com",
        },
      ],
      skipDuplicates: true,
    });
  });

  afterEach(async () => {
    await prisma.document.deleteMany({
      where: { ownerId: { in: [ownerId, otherOwnerId] } },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { id: { in: [ownerId, otherOwnerId, sharedEditorId] } },
    });
    await prisma.$disconnect();
  });

  it("persists, lists, renames, and deletes owned documents", async () => {
    const first = await repository.create({
      id: "7290b390-1375-408e-a7dd-75ab7964b06c",
      ownerId,
      title: "First",
      contentJson: emptyContent,
      contentText: "",
    });
    const second = await repository.create({
      id: "5b2b276b-0d6b-42e6-bf50-29ad94a136ab",
      ownerId,
      title: "Second",
      contentJson: emptyContent,
      contentText: "",
    });

    const listed = await repository.listOwned({ ownerId, limit: 10 });
    expect(listed.map((item) => item.id)).toEqual(
      expect.arrayContaining([first.id, second.id]),
    );

    const renamed = await repository.updateTitle({
      id: first.id,
      title: "Renamed",
    });
    expect(renamed.title).toBe("Renamed");

    await repository.deleteById(first.id);
    expect(await repository.findById(first.id)).toBeNull();
    expect(await repository.findById(second.id)).not.toBeNull();
  });

  it("increments once and rejects stale or wrong-owner content writes", async () => {
    const document = await repository.create({
      id: "2a4b11dc-e69e-4eed-8073-180b91dd7c96",
      ownerId,
      title: "Concurrent",
      contentJson: emptyContent,
      contentText: "",
    });
    const updatedContent: JSONContent = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Version two" }],
        },
      ],
    };

    await expect(
      repository.updateContentIfVersionMatches({
        id: document.id,
        viewerId: ownerId,
        expectedVersion: 1,
        contentJson: updatedContent,
        contentText: "Version two",
      }),
    ).resolves.toBe(1);
    await expect(
      repository.updateContentIfVersionMatches({
        id: document.id,
        viewerId: ownerId,
        expectedVersion: 1,
        contentJson: emptyContent,
        contentText: "",
      }),
    ).resolves.toBe(0);
    await expect(
      repository.updateContentIfVersionMatches({
        id: document.id,
        viewerId: otherOwnerId,
        expectedVersion: 2,
        contentJson: emptyContent,
        contentText: "",
      }),
    ).resolves.toBe(0);

    const persisted = await repository.findById(document.id);
    expect(persisted).toMatchObject({
      version: 2,
      contentText: "Version two",
    });
  });

  it("supports shared-document listing, shared-editor saves, idempotent grants, and revokes", async () => {
    const document = await repository.create({
      id: "d9e8a1db-5371-49d9-9ce7-fdbed9bebbc1",
      ownerId,
      title: "Shared doc",
      contentJson: emptyContent,
      contentText: "",
    });

    await expect(
      repository.createShareIfMissing({
        documentId: document.id,
        userId: sharedEditorId,
        role: "EDITOR",
      }),
    ).resolves.toMatchObject({ created: true });
    await expect(
      repository.createShareIfMissing({
        documentId: document.id,
        userId: sharedEditorId,
        role: "EDITOR",
      }),
    ).resolves.toMatchObject({ created: false });

    const sharedList = await repository.listShared({
      viewerId: sharedEditorId,
      limit: 10,
    });
    expect(sharedList.map((item) => item.id)).toContain(document.id);

    const visibleToEditor = await repository.findByIdForViewer({
      documentId: document.id,
      viewerId: sharedEditorId,
    });
    expect(visibleToEditor?.viewerShareRole).toBe("EDITOR");

    await expect(
      repository.updateContentIfVersionMatches({
        id: document.id,
        viewerId: sharedEditorId,
        expectedVersion: 1,
        contentJson: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Edited by shared user" }],
            },
          ],
        },
        contentText: "Edited by shared user",
      }),
    ).resolves.toBe(1);

    await expect(
      repository.deleteShare(document.id, sharedEditorId),
    ).resolves.toBe(1);
    await expect(
      repository.deleteShare(document.id, sharedEditorId),
    ).resolves.toBe(0);
  });
});
