import type { JSONContent } from "@tiptap/core";
import { z } from "zod";

import { ValidationError } from "@/lib/application-errors";

const MAX_SERIALIZED_BYTES = 256 * 1024;
const MAX_DEPTH = 20;
const MAX_TOTAL_TEXT_LENGTH = 100_000;
const MAX_CHILDREN = 200;

const markSchema = z
  .object({
    type: z.enum(["bold", "italic", "underline"]),
  })
  .strict();

const textNodeSchema: z.ZodType<JSONContent> = z
  .object({
    type: z.literal("text"),
    text: z.string().min(1),
    marks: z.array(markSchema).max(3).optional(),
  })
  .strict();

const inlineNodeSchema: z.ZodType<JSONContent> = z.lazy(() => textNodeSchema);

const paragraphNodeSchema: z.ZodType<JSONContent> = z
  .object({
    type: z.literal("paragraph"),
    content: z.array(inlineNodeSchema).max(MAX_CHILDREN).optional(),
  })
  .strict();

const headingNodeSchema: z.ZodType<JSONContent> = z
  .object({
    type: z.literal("heading"),
    attrs: z.object({ level: z.union([z.literal(1), z.literal(2), z.literal(3)]) }),
    content: z.array(inlineNodeSchema).min(1).max(MAX_CHILDREN),
  })
  .strict();

const listItemNodeSchema: z.ZodType<JSONContent> = z.lazy(() =>
  z
    .object({
      type: z.literal("listItem"),
      content: z
        .array(
          z.union([paragraphNodeSchema, bulletListNodeSchema, orderedListNodeSchema]),
        )
        .min(1)
        .max(6),
    })
    .strict(),
);

const bulletListNodeSchema: z.ZodType<JSONContent> = z.lazy(() =>
  z
    .object({
      type: z.literal("bulletList"),
      content: z.array(listItemNodeSchema).min(1).max(MAX_CHILDREN),
    })
    .strict(),
);

const orderedListNodeSchema: z.ZodType<JSONContent> = z.lazy(() =>
  z
    .object({
      type: z.literal("orderedList"),
      attrs: z.object({ start: z.number().int().positive().optional() }).optional(),
      content: z.array(listItemNodeSchema).min(1).max(MAX_CHILDREN),
    })
    .strict(),
);

const blockNodeSchema: z.ZodType<JSONContent> = z.lazy(() =>
  z.union([
    paragraphNodeSchema,
    headingNodeSchema,
    bulletListNodeSchema,
    orderedListNodeSchema,
  ]),
);

export const documentContentSchema: z.ZodType<JSONContent> = z
  .object({
    type: z.literal("doc"),
    content: z.array(blockNodeSchema).max(MAX_CHILDREN).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    const serialized = new TextEncoder().encode(JSON.stringify(value));

    if (serialized.byteLength > MAX_SERIALIZED_BYTES) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Document content is too large.",
      });
    }

    walkDocument(value, 0, context, { totalTextLength: 0 });
  });

function walkDocument(
  node: JSONContent,
  depth: number,
  context: z.RefinementCtx,
  aggregate: { totalTextLength: number },
): void {
  if (depth > MAX_DEPTH) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Document nesting is too deep.",
    });
    return;
  }

  if (node.text) {
    aggregate.totalTextLength += node.text.length;
  }

  if (aggregate.totalTextLength > MAX_TOTAL_TEXT_LENGTH) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Document text exceeds the allowed length.",
    });
  }

  for (const child of node.content ?? []) {
    walkDocument(child, depth + 1, context, aggregate);
  }
}

export function createEmptyDocumentContent(): JSONContent {
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
      },
    ],
  };
}

export function parseDocumentContent(content: unknown): JSONContent {
  const parsed = documentContentSchema.safeParse(content);

  if (!parsed.success) {
    throw new ValidationError("Document content is invalid.", {
      content: z.treeifyError(parsed.error),
    });
  }

  return parsed.data;
}

export function documentContentToPlainText(content: JSONContent): string {
  const lines: string[] = [];

  const visit = (node: JSONContent) => {
    if (node.type === "paragraph" || node.type === "heading") {
      const inlineText = collectInlineText(node);
      if (inlineText) {
        lines.push(inlineText);
      }
    }

    for (const child of node.content ?? []) {
      visit(child);
    }
  };

  for (const node of content.content ?? []) {
    visit(node);
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function collectInlineText(node: JSONContent) {
  const buffer: string[] = [];

  const visit = (current: JSONContent) => {
    if (current.type === "text" && current.text) {
      buffer.push(current.text);
    }

    for (const child of current.content ?? []) {
      visit(child);
    }
  };

  visit(node);

  return buffer.join(" ").replace(/\s+/g, " ").trim();
}
