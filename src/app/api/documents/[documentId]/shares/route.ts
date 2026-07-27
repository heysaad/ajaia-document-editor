import { NextResponse } from "next/server";

import { resolveSessionUser } from "@/features/auth/server/auth-session";
import { shareGrantSchema } from "@/features/document-sharing/server/document-share-schemas";
import { documentIdParamSchema } from "@/features/documents/server/document-schemas";
import { appContainer } from "@/infra/di/container";
import { DI_TOKENS } from "@/infra/di/tokens";
import { handleRoute, parseJsonBody } from "@/infra/http/route";

const documentService = appContainer.resolve(DI_TOKENS.DocumentService);

export const runtime = "nodejs";

type DocumentShareRouteContext = {
  params: Promise<{ documentId: string }>;
};

export const GET = handleRoute(async (
  _request: Request,
  context: DocumentShareRouteContext,
) => {
  const viewer = await resolveSessionUser();
  const params = documentIdParamSchema.parse(await context.params);
  const shares = await documentService.listDocumentShares({
    ownerId: viewer.id,
    documentId: params.documentId,
  });

  return NextResponse.json(shares);
});

export const POST = handleRoute(async (
  request: Request,
  context: DocumentShareRouteContext,
) => {
  const viewer = await resolveSessionUser();
  const params = documentIdParamSchema.parse(await context.params);
  const body = await parseJsonBody(request, shareGrantSchema);
  const result = await documentService.grantDocumentShare({
    ownerId: viewer.id,
    documentId: params.documentId,
    userId: body.userId,
    email: body.email,
  });

  return NextResponse.json(result, { status: result.created ? 201 : 200 });
});
