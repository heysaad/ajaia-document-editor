import { NextResponse } from "next/server";

import { resolveSessionUser } from "@/features/auth/server/auth-session";
import {
  documentIdParamSchema,
  updateDocumentContentSchema,
} from "@/features/documents/server/document-schemas";
import { appContainer } from "@/infra/di/container";
import { DI_TOKENS } from "@/infra/di/tokens";
import { handleRoute, parseJsonBody } from "@/infra/http/route";

const documentService = appContainer.resolve(DI_TOKENS.DocumentService);

export const runtime = "nodejs";
type DocumentContentRouteContext = {
  params: Promise<{ documentId: string }>;
};

export const PUT = handleRoute(async (
  request: Request,
  context: DocumentContentRouteContext,
) => {
  const viewer = await resolveSessionUser();
  const params = documentIdParamSchema.parse(await context.params);
  const body = await parseJsonBody(request, updateDocumentContentSchema);
  const document = await documentService.updateDocumentContent({
    ownerId: viewer.id,
    documentId: params.documentId,
    expectedVersion: body.expectedVersion,
    content: body.content,
  });

  return NextResponse.json(document);
});
