import { NextResponse } from "next/server";

import { resolveSessionUser } from "@/features/auth/server/auth-session";
import { shareUserIdParamSchema } from "@/features/document-sharing/server/document-share-schemas";
import { appContainer } from "@/infra/di/container";
import { DI_TOKENS } from "@/infra/di/tokens";
import { handleRoute } from "@/infra/http/route";

const documentService = appContainer.resolve(DI_TOKENS.DocumentService);

export const runtime = "nodejs";

type DocumentShareUserRouteContext = {
  params: Promise<{ documentId: string; userId: string }>;
};

export const DELETE = handleRoute(async (
  _request: Request,
  context: DocumentShareUserRouteContext,
) => {
  const viewer = await resolveSessionUser();
  const params = shareUserIdParamSchema.parse(await context.params);
  await documentService.revokeDocumentShare({
    ownerId: viewer.id,
    documentId: params.documentId,
    userId: params.userId,
  });

  return new NextResponse(null, { status: 204 });
});
