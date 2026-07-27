import { z } from "zod";

import { documentIdParamSchema } from "@/features/documents/server/document-schemas";

export const shareGrantSchema = z
  .object({
    userId: z.string().uuid().optional(),
    email: z.string().email().max(320).optional(),
  })
  .superRefine((value, context) => {
    const filled = [value.userId, value.email].filter(Boolean);

    if (filled.length !== 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide exactly one share target.",
        path: ["userId"],
      });
    }
  });

export const shareUserIdParamSchema = documentIdParamSchema.extend({
  userId: z.string().uuid(),
});

export const eligibleShareUsersSearchSchema = z.object({
  q: z.string().trim().max(320).default(""),
});
