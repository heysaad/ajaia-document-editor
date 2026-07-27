import { NextResponse } from "next/server";

import { identityService } from "@/features/auth/server/identity-service.server";
import {
  documentIdParamSchema,
  renameDocumentSchema,
} from "@/features/documents/server/document-schemas";
import { documentService } from "@/features/documents/server/document-service.server";
import { parseJsonBody, toErrorResponse } from "@/infra/http/route";

export const runtime = "nodejs";
type DocumentRouteContext = {
  params: Promise<{ documentId: string }>;
};

export async function GET(
  _request: Request,
  context: DocumentRouteContext,
) {
  try {
    const viewer = await identityService.resolveViewerIdentity();
    const params = documentIdParamSchema.parse(await context.params);
    const document = await documentService.getOwnedDocument({
      ownerId: viewer.id,
      documentId: params.documentId,
    });

    return NextResponse.json(document);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  context: DocumentRouteContext,
) {
  try {
    const viewer = await identityService.resolveViewerIdentity();
    const params = documentIdParamSchema.parse(await context.params);
    const body = await parseJsonBody(request, renameDocumentSchema);
    const document = await documentService.renameDocument({
      ownerId: viewer.id,
      documentId: params.documentId,
      title: body.title,
    });

    return NextResponse.json(document);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  context: DocumentRouteContext,
) {
  try {
    const viewer = await identityService.resolveViewerIdentity();
    const params = documentIdParamSchema.parse(await context.params);
    await documentService.deleteDocument({
      ownerId: viewer.id,
      documentId: params.documentId,
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
