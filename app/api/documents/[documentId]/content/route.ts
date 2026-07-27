import { NextResponse } from "next/server";

import {
  nextCookieSessionStore,
  prismaIdentityUserLookup,
} from "@/features/auth/server/identity-adapters";
import { resolveViewerIdentity } from "@/features/auth/server/identity-provider";
import {
  documentIdParamSchema,
  updateDocumentContentSchema,
} from "@/features/documents/server/document-schemas";
import { documentService } from "@/features/documents/server/document-service.server";
import { parseJsonBody, toErrorResponse } from "@/infra/http/route";

export const runtime = "nodejs";
type DocumentContentRouteContext = {
  params: Promise<{ documentId: string }>;
};

export async function PUT(
  request: Request,
  context: DocumentContentRouteContext,
) {
  try {
    const viewer = await resolveViewerIdentity(
      nextCookieSessionStore,
      prismaIdentityUserLookup,
    );
    const params = documentIdParamSchema.parse(await context.params);
    const body = await parseJsonBody(request, updateDocumentContentSchema);
    const document = await documentService.updateDocumentContent({
      ownerId: viewer.id,
      documentId: params.documentId,
      expectedVersion: body.expectedVersion,
      content: body.content,
    });

    return NextResponse.json(document);
  } catch (error) {
    return toErrorResponse(error);
  }
}
