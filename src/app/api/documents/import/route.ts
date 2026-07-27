import { NextResponse } from "next/server";

import {
  IMPORT_FIELD_NAME,
  MAX_IMPORT_FILE_BYTES,
} from "@/features/document-import/server/import-constants";
import { createImportValidationError } from "@/features/document-import/server/import-errors";
import { resolveSessionUser } from "@/features/auth/server/auth-session";
import { appContainer } from "@/infra/di/container";
import { DI_TOKENS } from "@/infra/di/tokens";
import { handleRoute } from "@/infra/http/route";

const documentService = appContainer.resolve(DI_TOKENS.DocumentService);

export const runtime = "nodejs";

export const POST = handleRoute(async (request: Request) => {
  const viewer = await resolveSessionUser();
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    throw createImportValidationError(
      "The request body must be multipart form data.",
      "invalid_form_data",
    );
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    throw createImportValidationError(
      "The uploaded form data could not be read.",
      "invalid_form_data",
    );
  }

  const files = [...formData.values()].filter(
    (value): value is File => value instanceof File,
  );

  if (files.length === 0) {
    throw createImportValidationError(
      "Select a .md or .txt file to import.",
      "missing_file",
    );
  }

  if (files.length > 1) {
    throw createImportValidationError(
      "Import exactly one file at a time.",
      "multiple_files",
    );
  }

  const fileEntry = formData.get(IMPORT_FIELD_NAME);
  const file = fileEntry instanceof File ? fileEntry : files[0];

  if (file.size > MAX_IMPORT_FILE_BYTES) {
    throw createImportValidationError(
      "Files must be 1 MiB or smaller.",
      "file_too_large",
      { maxBytes: MAX_IMPORT_FILE_BYTES },
    );
  }

  const document = await documentService.importDocument({
    ownerId: viewer.id,
    fileName: file.name,
    mimeType: file.type,
    fileSize: file.size,
    fileContent: new Uint8Array(await file.arrayBuffer()),
  });

  return NextResponse.json(document, { status: 201 });
});
