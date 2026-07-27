import type { JSONContent } from "@tiptap/core";
import { describe, expect, it } from "vitest";

import {
  documentContentToMarkdown,
  documentContentToPlainText,
  parseDocumentContent,
} from "@/features/document-editing/server/document-content";
import { ValidationError } from "@/lib/application-errors";

const formattedDocument: JSONContent = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Release notes", marks: [{ type: "bold" }] }],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Ready ", marks: [{ type: "italic" }] },
        { type: "text", text: "for review", marks: [{ type: "underline" }] },
      ],
    },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "First item" }],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Second item" }],
            },
          ],
        },
      ],
    },
  ],
};

describe("document content", () => {
  it("accepts every supported node and mark", () => {
    expect(parseDocumentContent(formattedDocument)).toEqual(formattedDocument);
  });

  it("derives each block of plain text exactly once", () => {
    expect(documentContentToPlainText(formattedDocument)).toBe(
      "Release notes\nReady for review\nFirst item\nSecond item",
    );
  });

  it("serializes supported content as markdown", () => {
    expect(documentContentToMarkdown(formattedDocument)).toBe(
      "## Release notes\n\nReady for review\n\n- First item\n- Second item",
    );
  });

  it("rejects unsupported nodes, marks, and malformed content", () => {
    expect(() =>
      parseDocumentContent({
        type: "doc",
        content: [{ type: "image", attrs: { src: "https://example.com/x" } }],
      }),
    ).toThrow(ValidationError);
    expect(() =>
      parseDocumentContent({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "x", marks: [{ type: "link" }] }],
          },
        ],
      }),
    ).toThrow(ValidationError);
    expect(() => parseDocumentContent(null)).toThrow(ValidationError);
  });

  it("rejects aggregate text and UTF-8 content beyond configured limits", () => {
    const tooMuchText = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "a".repeat(50_001) },
            { type: "text", text: "b".repeat(50_000) },
          ],
        },
      ],
    };
    const tooManyBytes = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "😀".repeat(70_000) }],
        },
      ],
    };

    expect(() => parseDocumentContent(tooMuchText)).toThrow(ValidationError);
    expect(() => parseDocumentContent(tooManyBytes)).toThrow(ValidationError);
  });
});
