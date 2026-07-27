import { describe, expect, it } from "vitest";

import { ApiClientError } from "@/lib/api-client";
import {
  DOCUMENT_IMPORT_MAX_BYTES,
  getDocumentImportErrorMessage,
  validateDocumentImportSelection,
} from "@/features/document-import/client/document-import-errors";

describe("document import errors", () => {
  it("accepts supported markdown files and blocks unsupported selections", () => {
    const markdownFile = new File(["# Notes"], "notes.md", {
      type: "text/plain",
    });
    const imageFile = new File(["png"], "diagram.png", {
      type: "image/png",
    });

    expect(validateDocumentImportSelection(markdownFile)).toBeNull();
    expect(validateDocumentImportSelection(imageFile)).toBe(
      "Choose a .txt or .md file.",
    );
  });

  it("rejects oversized files before upload", () => {
    const oversizedFile = new File(
      [new Uint8Array(DOCUMENT_IMPORT_MAX_BYTES + 1)],
      "large.txt",
      { type: "text/plain" },
    );

    expect(validateDocumentImportSelection(oversizedFile)).toBe(
      "Choose a file that is 1 MiB or smaller.",
    );
  });

  it("maps stable backend reasons to actionable messages", () => {
    const utf8Error = new ApiClientError(
      "The uploaded file must be valid UTF-8 text.",
      400,
      "validation_error",
      { field: "file", reason: "invalid_utf8" },
    );
    const unauthorizedError = new ApiClientError(
      "An authenticated user session is required.",
      401,
      "unauthorized",
    );

    expect(getDocumentImportErrorMessage(utf8Error)).toBe(
      "This file is not valid UTF-8 text. Export it as UTF-8 and try again.",
    );
    expect(getDocumentImportErrorMessage(unauthorizedError)).toBe(
      "Your session has expired. Sign in again before importing a file.",
    );
  });
});
