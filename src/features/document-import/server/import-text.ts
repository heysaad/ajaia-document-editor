import type { JSONContent } from "@tiptap/core";

export function plainTextToDocumentContent(text: string): JSONContent {
  const normalized = text.replace(/\r\n?/g, "\n");
  const blocks = normalized
    .split(/\n{2,}/u)
    .map((block) => block.split("\n").map((line) => line.trim()).join(" ").trim())
    .filter((block) => block.length > 0)
    .map<JSONContent>((block) => ({
      type: "paragraph",
      content: [{ type: "text", text: block }],
    }));

  return {
    type: "doc",
    ...(blocks.length > 0 ? { content: blocks } : {}),
  };
}
