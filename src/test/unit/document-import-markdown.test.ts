import { describe, expect, it } from "vitest";

import { markdownToDocumentContent } from "@/features/document-import/server/import-markdown";

describe("markdown import", () => {
  it("converts supported headings, emphasis, strong text, and lists", () => {
    expect(
      markdownToDocumentContent(`# Heading

Intro with *italic* and **bold** text.

1. First
2. Second`),
    ).toEqual({
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "Heading" }],
        },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Intro with " },
            { type: "text", text: "italic", marks: [{ type: "italic" }] },
            { type: "text", text: " and " },
            { type: "text", text: "bold", marks: [{ type: "bold" }] },
            { type: "text", text: " text." },
          ],
        },
        {
          type: "orderedList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "First" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Second" }],
                },
              ],
            },
          ],
        },
      ],
    });
  });

  it("flattens unsupported links and HTML into safe readable text", () => {
    expect(
      markdownToDocumentContent(
        `<script>alert("x")</script>

[Example](https://example.com) and \`code\``,
      ),
    ).toEqual({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: '<script>alert("x")</script>' }],
        },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Example and code" },
          ],
        },
      ],
    });
  });
});
