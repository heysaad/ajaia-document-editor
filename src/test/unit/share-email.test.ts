import { describe, expect, it } from "vitest";

import { normalizeShareEmail } from "@/features/document-sharing/server/share-email";

describe("share email normalization", () => {
  it("trims and lowercases emails deterministically", () => {
    expect(normalizeShareEmail("  Jordan@example.COM ")).toBe(
      "jordan@example.com",
    );
  });
});
