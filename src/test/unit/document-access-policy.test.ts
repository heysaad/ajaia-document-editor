import { describe, expect, it } from "vitest";

import { resolveDocumentAccess } from "@/features/document-sharing/server/document-access-policy";

describe("document access policy", () => {
  it("returns owner access for the document owner", () => {
    expect(
      resolveDocumentAccess(
        {
          ownerId: "owner-id",
          viewerShareRole: null,
        },
        "owner-id",
      ),
    ).toBe("owner");
  });

  it("returns shared editor access for an explicit editor share", () => {
    expect(
      resolveDocumentAccess(
        {
          ownerId: "owner-id",
          viewerShareRole: "EDITOR",
        },
        "viewer-id",
      ),
    ).toBe("shared_editor");
  });

  it("returns no access for unrelated users", () => {
    expect(
      resolveDocumentAccess(
        {
          ownerId: "owner-id",
          viewerShareRole: null,
        },
        "viewer-id",
      ),
    ).toBe("none");
  });
});
