import {
  DEFAULT_DOCUMENT_TITLE,
  DOCUMENT_TITLE_LIMIT,
} from "@/features/documents/server/document-constants";
import { ValidationError } from "@/lib/application-errors";

function normalizeTitleValue(rawTitle: string) {
  return rawTitle.replace(/\s+/g, " ").trim();
}

export function normalizeCreateTitle(title?: string | null) {
  if (!title) {
    return DEFAULT_DOCUMENT_TITLE;
  }

  const normalized = normalizeTitleValue(title);

  if (!normalized) {
    return DEFAULT_DOCUMENT_TITLE;
  }

  if (normalized.length > DOCUMENT_TITLE_LIMIT) {
    throw new ValidationError(
      `Document titles must be ${DOCUMENT_TITLE_LIMIT} characters or fewer.`,
    );
  }

  return normalized;
}

export function normalizeRenameTitle(title: string) {
  const normalized = normalizeTitleValue(title);

  if (!normalized) {
    throw new ValidationError("Document titles cannot be empty.");
  }

  if (normalized.length > DOCUMENT_TITLE_LIMIT) {
    throw new ValidationError(
      `Document titles must be ${DOCUMENT_TITLE_LIMIT} characters or fewer.`,
    );
  }

  return normalized;
}
