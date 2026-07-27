import type { JSONContent } from "@tiptap/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FetchDocumentSaveClient } from "@/features/document-editing/client/document-save-client";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetch document save client", () => {
  it("sends document content, version, and abort signal to the content endpoint", async () => {
    const content = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Saved" }],
        },
      ],
    } satisfies JSONContent;
    const savedDocument = {
      id: "5c301301-2b15-47ec-ae55-b0f3ac3bcf51",
      title: "Draft",
      excerpt: "Saved",
      version: 4,
      updatedAt: "2026-07-27T10:01:00.000Z",
      createdAt: "2026-07-27T10:00:00.000Z",
      contentJson: content,
      owner: {
        id: "771f2b30-3b0c-40d8-a96f-6c2ded9e70a1",
        name: "Maya Patel",
        email: "maya@example.com",
      },
    };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(savedDocument), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();
    const client = new FetchDocumentSaveClient();

    await expect(
      client.save(savedDocument.id, content, 3, controller.signal),
    ).resolves.toEqual(savedDocument);
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/documents/${savedDocument.id}/content`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, expectedVersion: 3 }),
        signal: controller.signal,
      },
    );
  });
});
