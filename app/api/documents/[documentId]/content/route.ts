import { NextResponse } from "next/server";

import { identityService } from "@/features/auth/server/identity-service.server";
import {
  documentIdParamSchema,
  updateDocumentContentSchema,
} from "@/features/documents/server/document-schemas";
import { documentService } from "@/features/documents/server/document-service.server";
import { handleRoute, parseJsonBody } from "@/infra/http/route";

export const runtime = "nodejs";
type DocumentContentRouteContext = {
  params: Promise<{ documentId: string }>;
};

export const PUT = handleRoute(async (
  request: Request,
  context: DocumentContentRouteContext,
) => {
  const viewer = await identityService.resolveViewerIdentity();
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
