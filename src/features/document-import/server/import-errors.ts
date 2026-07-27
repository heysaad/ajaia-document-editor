import type { ImportValidationReason } from "@/features/document-import/server/import-constants";
import { ValidationError } from "@/lib/application-errors";

export function createImportValidationError(
  message: string,
  reason: ImportValidationReason,
  details?: Record<string, unknown>,
) {
  return new ValidationError(message, {
    field: "file",
    reason,
    ...details,
  });
}
