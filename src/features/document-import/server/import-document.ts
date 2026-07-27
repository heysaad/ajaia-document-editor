import type { JSONContent } from "@tiptap/core";

import {
  documentContentToPlainText,
  parseDocumentContent,
} from "@/features/document-editing/server/document-content";
import {
  MAX_IMPORT_FILE_BYTES,
  SUPPORTED_IMPORT_EXTENSIONS,
  SUPPORTED_IMPORT_MIME_TYPES,
  type SupportedImportExtension,
} from "@/features/document-import/server/import-constants";
import { createImportValidationError } from "@/features/document-import/server/import-errors";
import {
  getImportFileExtension,
  normalizeImportedDocumentTitle,
} from "@/features/document-import/server/import-file-name";
import { markdownToDocumentContent } from "@/features/document-import/server/import-markdown";
import { plainTextToDocumentContent } from "@/features/document-import/server/import-text";

type ConvertImportedDocumentInput = {
  fileName: string;
  mimeType: string;
  fileSize: number;
  fileContent: Uint8Array;
};

type ImportedDocument = {
  title: string | undefined;
  contentJson: JSONContent;
  contentText: string;
};

const utf8Decoder = new TextDecoder("utf-8", { fatal: true });
const unsupportedControlCharacterPattern = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u;

export function validateImportFileSize(fileSize: number) {
  if (fileSize > MAX_IMPORT_FILE_BYTES) {
    throw createImportValidationError(
      "Files must be 1 MiB or smaller.",
      "file_too_large",
      { maxBytes: MAX_IMPORT_FILE_BYTES },
    );
  }
}

export function convertImportedDocument(
  input: ConvertImportedDocumentInput,
): ImportedDocument {
  validateImportFileSize(input.fileSize);

  const extension = parseSupportedImportExtension(input.fileName);
  validateImportMimeType(extension, input.mimeType);

  let text: string;

  try {
    text = utf8Decoder.decode(input.fileContent);
  } catch {
    throw createImportValidationError(
      "The uploaded file must be valid UTF-8 text.",
      "invalid_utf8",
    );
  }

  if (unsupportedControlCharacterPattern.test(text)) {
    throw createImportValidationError(
      "The uploaded file contains unsupported content.",
      "unsupported_content",
    );
  }

  const content = convertTextByExtension(extension, text);
  const parsedContent = parseDocumentContent(content);
  const contentText = documentContentToPlainText(parsedContent);

  if (!contentText.trim()) {
    throw createImportValidationError(
      "The uploaded file does not contain any importable text.",
      "empty_content",
    );
  }

  return {
    title: normalizeImportedDocumentTitle(input.fileName),
    contentJson: parsedContent,
    contentText,
  };
}

function parseSupportedImportExtension(
  fileName: string,
): SupportedImportExtension {
  const extension = getImportFileExtension(fileName);

  if (
    !extension ||
    !SUPPORTED_IMPORT_EXTENSIONS.includes(extension as SupportedImportExtension)
  ) {
    throw createImportValidationError(
      "Only .md and .txt files can be imported.",
      "unsupported_extension",
      { allowedExtensions: [...SUPPORTED_IMPORT_EXTENSIONS] },
    );
  }

  return extension as SupportedImportExtension;
}

function validateImportMimeType(
  extension: SupportedImportExtension,
  mimeType: string,
) {
  const normalizedMimeType = mimeType.trim().toLowerCase();

  if (!normalizedMimeType) {
    return;
  }

  const allowedMimeTypes: string[] = [...SUPPORTED_IMPORT_MIME_TYPES[extension]];

  if (!allowedMimeTypes.includes(normalizedMimeType)) {
    throw createImportValidationError(
      "The uploaded file type does not match its contents.",
      "unsupported_mime_type",
      {
        allowedMimeTypes,
      },
    );
  }
}

function convertTextByExtension(
  extension: SupportedImportExtension,
  text: string,
): JSONContent {
  switch (extension) {
    case ".md":
      return markdownToDocumentContent(text);
    case ".txt":
      return plainTextToDocumentContent(text);
  }
}
