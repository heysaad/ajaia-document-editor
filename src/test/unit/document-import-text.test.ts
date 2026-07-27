import { describe, expect, it } from "vitest";

import { plainTextToDocumentContent } from "@/features/document-import/server/import-text";

describe("plain text import", () => {
  it("splits blank lines into paragraphs and normalizes CRLF", () => {
    expect(
      plainTextToDocumentContent("First line\r\nSecond line\r\n\r\nThird line\r\n"),
    ).toEqual({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "First line Second line" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Third line" }],
        },
      ],
    });
  });

  it("preserves unicode text and drops trailing blank paragraphs", () => {
    expect(plainTextToDocumentContent("नमस्ते world\n\n")).toEqual({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "नमस्ते world" }],
        },
      ],
    });
  });
});
