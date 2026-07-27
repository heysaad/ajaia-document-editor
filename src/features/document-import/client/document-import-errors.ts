import { ApiClientError } from "@/lib/api-client";

export const DOCUMENT_IMPORT_MAX_BYTES = 1_048_576;
export const DOCUMENT_IMPORT_ACCEPT =
  ".txt,.md,text/plain,text/markdown,text/x-markdown";
export const DOCUMENT_IMPORT_SUPPORTED_LABEL = ".txt or .md";
export const DOCUMENT_IMPORT_SIZE_LABEL = "Up to 1 MiB";

const SUPPORTED_EXTENSIONS = new Set(["txt", "md"]);
const TXT_MIME_TYPES = new Set(["text/plain"]);
const MARKDOWN_MIME_TYPES = new Set([
  "",
  "text/plain",
  "text/markdown",
  "text/x-markdown",
]);

function getFileExtension(fileName: string) {
  const normalized = fileName.trim().toLowerCase();
  const segments = normalized.split(".");
  return segments.length > 1 ? (segments.at(-1) ?? "") : "";
}

export function validateDocumentImportSelection(file: File): string | null {
  const extension = getFileExtension(file.name);

  if (!SUPPORTED_EXTENSIONS.has(extension)) {
    return "Choose a .txt or .md file.";
  }

  if (file.size > DOCUMENT_IMPORT_MAX_BYTES) {
    return "Choose a file that is 1 MiB or smaller.";
  }

  if (!file.type) {
    return null;
  }

  if (extension === "txt" && !TXT_MIME_TYPES.has(file.type)) {
    return "This file does not look like plain text. Choose a .txt or .md file.";
  }

  if (extension === "md" && !MARKDOWN_MIME_TYPES.has(file.type)) {
    return "This file does not look like supported Markdown text.";
  }

  return null;
}

export function getDocumentImportErrorMessage(error: unknown): string {
  if (!(error instanceof ApiClientError)) {
    return "The file could not be imported. Try again.";
  }

  if (error.code === "unauthorized") {
    return "Your session has expired. Sign in again before importing a file.";
  }

  if (error.code !== "validation_error") {
    return error.message || "The file could not be imported. Try again.";
  }

  const details = error.details as
    | {
        field?: string;
        reason?: string;
      }
    | undefined;

  if (details?.field !== "file") {
    return error.message || "The selected file could not be imported.";
  }

  switch (details.reason) {
    case "missing_file":
      return "Choose a .txt or .md file before importing.";
    case "multiple_files":
      return "Import one file at a time.";
    case "unsupported_extension":
    case "unsupported_mime_type":
      return "Only .txt and .md files are supported for import.";
    case "file_too_large":
      return "Choose a file that is 1 MiB or smaller.";
    case "invalid_utf8":
      return "This file is not valid UTF-8 text. Export it as UTF-8 and try again.";
    case "empty_content":
      return "This file does not contain any importable text.";
    case "unsupported_content":
      return "The file could not be converted into a supported document format.";
    default:
      return error.message || "The selected file could not be imported.";
  }
}
