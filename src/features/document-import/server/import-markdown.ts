import type { JSONContent } from "@tiptap/core";
import { toString } from "mdast-util-to-string";
import type { Content, Root } from "mdast";
import remarkParse from "remark-parse";
import { unified } from "unified";

type SupportedMark = "bold" | "italic";

const markdownParser = unified().use(remarkParse);

export function markdownToDocumentContent(markdown: string): JSONContent {
  const tree = markdownParser.parse(markdown) as Root;
  const content = tree.children.flatMap(convertBlockNode).filter(Boolean);

  return {
    type: "doc",
    ...(content.length > 0 ? { content } : {}),
  };
}

function convertBlockNode(node: Content): JSONContent[] {
  switch (node.type) {
    case "paragraph": {
      const content = convertInlineNodes(node.children);
      if (content.length === 0) {
        return [];
      }

      return [{ type: "paragraph", content }];
    }
    case "heading": {
      const content = convertInlineNodes(node.children);
      if (content.length === 0) {
        return [];
      }

      return [
        {
          type: "heading",
          attrs: { level: Math.min(Math.max(node.depth, 1), 3) as 1 | 2 | 3 },
          content,
        },
      ];
    }
    case "list": {
      const items = node.children
        .map(convertListItem)
        .filter(isPresent);

      if (items.length === 0) {
        return [];
      }

      return [
        {
          type: node.ordered ? "orderedList" : "bulletList",
          ...(node.ordered && node.start && node.start > 1
            ? { attrs: { start: node.start } }
            : {}),
          content: items,
        },
      ];
    }
    case "html":
      return fallbackParagraphFromValue(node.value);
    default:
      return fallbackParagraphFromValue(toString(node));
  }
}

function convertListItem(
  node: Extract<Content, { type: "listItem" }>,
): JSONContent | null {
  const content = node.children.flatMap((child) => convertBlockNode(child));

  if (content.length === 0) {
    const fallback = fallbackParagraphFromValue(toString(node));
    if (fallback.length === 0) {
      return null;
    }

    return {
      type: "listItem",
      content: fallback,
    } satisfies JSONContent;
  }

  return {
    type: "listItem",
    content,
  } satisfies JSONContent;
}

function convertInlineNodes(
  nodes: Extract<Content, { children?: unknown }>["children"],
  activeMarks: SupportedMark[] = [],
): JSONContent[] {
  const content: JSONContent[] = [];

  for (const node of nodes) {
    switch (node.type) {
      case "text":
        pushTextNode(content, node.value, activeMarks);
        break;
      case "emphasis":
        content.push(...convertInlineNodes(node.children, [...activeMarks, "italic"]));
        break;
      case "strong":
        content.push(...convertInlineNodes(node.children, [...activeMarks, "bold"]));
        break;
      case "break":
        pushTextNode(content, " ", activeMarks);
        break;
      case "html":
      case "inlineCode":
        pushTextNode(content, node.value, activeMarks);
        break;
      case "link":
      case "linkReference":
      case "delete":
        content.push(...convertInlineNodes(node.children, activeMarks));
        break;
      case "image":
      case "imageReference":
        pushTextNode(content, node.alt ?? "", activeMarks);
        break;
      default:
        pushTextNode(content, toString(node), activeMarks);
        break;
    }
  }

  return mergeAdjacentTextNodes(content);
}

function fallbackParagraphFromValue(value: string): JSONContent[] {
  const text = value.replace(/\s+/g, " ").trim();
  if (!text) {
    return [];
  }

  return [
    {
      type: "paragraph",
      content: [{ type: "text", text }],
    },
  ];
}

function pushTextNode(
  nodes: JSONContent[],
  text: string,
  activeMarks: SupportedMark[],
) {
  if (!text) {
    return;
  }

  const marks = dedupeMarks(activeMarks).map((mark) => ({ type: mark }));
  nodes.push({
    type: "text",
    text,
    ...(marks.length > 0 ? { marks } : {}),
  });
}

function dedupeMarks(activeMarks: SupportedMark[]) {
  return [...new Set(activeMarks)];
}

function mergeAdjacentTextNodes(nodes: JSONContent[]) {
  const merged: JSONContent[] = [];

  for (const node of nodes) {
    if (node.type !== "text" || !node.text) {
      continue;
    }

    const previous = merged.at(-1);
    if (
      previous?.type === "text" &&
      previous.text &&
      JSON.stringify(previous.marks ?? []) === JSON.stringify(node.marks ?? [])
    ) {
      previous.text += node.text;
      continue;
    }

    merged.push(node);
  }

  return merged;
}

function isPresent<T>(value: T | null): value is T {
  return value !== null;
}
