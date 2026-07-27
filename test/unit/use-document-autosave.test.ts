import type { JSONContent } from "@tiptap/core";
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { DocumentSaveClientPort } from "@/features/document-editing/client/document-save-client";
import { useDocumentAutosave } from "@/features/document-editing/client/use-document-autosave";
import type { DocumentDetail } from "@/features/documents/models";

const emptyContent: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

function savedDocument(contentJson: JSONContent, version = 2): DocumentDetail {
  return {
    id: "5c301301-2b15-47ec-ae55-b0f3ac3bcf51",
    title: "Draft",
    excerpt: "",
    version,
    updatedAt: "2026-07-27T10:01:00.000Z",
    createdAt: "2026-07-27T10:00:00.000Z",
    contentJson,
    owner: {
      id: "771f2b30-3b0c-40d8-a96f-6c2ded9e70a1",
      name: "Maya Patel",
      email: "maya@example.com",
    },
  };
}

afterEach(() => {
  vi.useRealTimers();
});

class StubDocumentSaveClient implements DocumentSaveClientPort {
  constructor(readonly save: DocumentSaveClientPort["save"]) {}
}

describe("document autosave", () => {
  it("coalesces rapid edits into one write with the latest content", async () => {
    vi.useFakeTimers();
    const save = vi.fn(async (_id, content: JSONContent) =>
      savedDocument(content),
    );
    const client = new StubDocumentSaveClient(save);
    const { result } = renderHook(() =>
      useDocumentAutosave({
        documentId: savedDocument(emptyContent).id,
        initialContent: emptyContent,
        initialVersion: 1,
        initialSavedAt: "2026-07-27T10:00:00.000Z",
        client,
      }),
    );
    const first = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "one" }] }],
    } satisfies JSONContent;
    const latest = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "latest" }] }],
    } satisfies JSONContent;

    act(() => {
      result.current.queueSave(first);
      result.current.queueSave(latest);
      vi.advanceTimersByTime(799);
    });
    expect(save).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(save).toHaveBeenCalledTimes(1);
    expect(save.mock.calls[0]?.[1]).toEqual(latest);
    expect(result.current.state).toMatchObject({ status: "saved", version: 2 });
  });

  it("keeps local content available after a failed write and retries it", async () => {
    const edited = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "retry me" }] }],
    } satisfies JSONContent;
    const save = vi
      .fn<DocumentSaveClientPort["save"]>()
      .mockRejectedValueOnce(new Error("Network unavailable"))
      .mockResolvedValueOnce(savedDocument(edited));
    const { result } = renderHook(() =>
      useDocumentAutosave({
        documentId: savedDocument(emptyContent).id,
        initialContent: emptyContent,
        initialVersion: 1,
        initialSavedAt: "2026-07-27T10:00:00.000Z",
        client: new StubDocumentSaveClient(save),
      }),
    );

    act(() => result.current.queueSave(edited));
    await act(async () => {
      await result.current.flush();
    });
    expect(result.current.state.status).toBe("error");

    await act(async () => {
      await result.current.retry();
    });

    expect(save).toHaveBeenCalledTimes(2);
    expect(save.mock.calls[1]?.[1]).toEqual(edited);
    expect(result.current.state.status).toBe("saved");
  });
});
