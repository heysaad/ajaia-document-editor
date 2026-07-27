export const MAX_IMPORT_FILE_BYTES = 1024 * 1024;

export const IMPORT_FIELD_NAME = "file";

export const SUPPORTED_IMPORT_EXTENSIONS = [".md", ".txt"] as const;

export const SUPPORTED_IMPORT_MIME_TYPES = {
  ".md": ["text/markdown", "text/plain", "text/x-markdown"],
  ".txt": ["text/plain"],
} as const;

export type SupportedImportExtension =
  (typeof SUPPORTED_IMPORT_EXTENSIONS)[number];

export type ImportValidationReason =
  | "missing_file"
  | "multiple_files"
  | "unsupported_extension"
  | "unsupported_mime_type"
  | "file_too_large"
  | "invalid_utf8"
  | "empty_content"
  | "unsupported_content"
  | "invalid_form_data";
