import { describe, expect, it } from "vitest";

import {
  createInitialSaveState,
  saveStateReducer,
} from "@/features/document-editing/client/save-state";

describe("save state reducer", () => {
  it("covers edit, save, failure, retry, and success transitions", () => {
    const initial = createInitialSaveState(4, "2026-07-27T10:00:00.000Z");
    const dirty = saveStateReducer(initial, { type: "edited" });
    const saving = saveStateReducer(dirty, { type: "save_started" });
    const failed = saveStateReducer(saving, {
      type: "save_failed",
      message: "Offline",
    });
    const retrying = saveStateReducer(failed, { type: "retry" });
    const saved = saveStateReducer(retrying, {
      type: "save_succeeded",
      version: 5,
      savedAt: "2026-07-27T10:01:00.000Z",
    });

    expect(dirty.status).toBe("dirty");
    expect(saving.status).toBe("saving");
    expect(failed).toMatchObject({ status: "error", message: "Offline" });
    expect(retrying.status).toBe("saving");
    expect(saved).toMatchObject({
      status: "saved",
      version: 5,
      message: null,
    });
  });

  it("pauses edits while conflicted", () => {
    const latestServerDocument = {
      id: "5c301301-2b15-47ec-ae55-b0f3ac3bcf51",
      title: "Server copy",
      excerpt: "",
      version: 7,
      updatedAt: "2026-07-27T10:01:00.000Z",
      createdAt: "2026-07-27T10:00:00.000Z",
      contentJson: { type: "doc" },
      owner: { id: "u", name: "User", email: "user@example.com" },
      accessRole: "OWNER" as const,
    };
    const conflicted = saveStateReducer(createInitialSaveState(6, null), {
      type: "conflict",
      latestServerDocument,
    });

    expect(saveStateReducer(conflicted, { type: "edited" })).toBe(conflicted);
  });
});
