import { NextResponse } from "next/server";

import { resolveSessionUser } from "@/features/auth/server/auth-session";
import { documentIdParamSchema } from "@/features/documents/server/document-schemas";
import { appContainer } from "@/infra/di/container";
import { DI_TOKENS } from "@/infra/di/tokens";
import { handleRoute } from "@/infra/http/route";

const documentService = appContainer.resolve(DI_TOKENS.DocumentService);

export const runtime = "nodejs";

type DocumentEligibleUsersRouteContext = {
  params: Promise<{ documentId: string }>;
};

export const GET = handleRoute(async (
  _request: Request,
  context: DocumentEligibleUsersRouteContext,
) => {
  const viewer = await resolveSessionUser();
  const params = documentIdParamSchema.parse(await context.params);
  const users = await documentService.listEligibleShareUsers({
    ownerId: viewer.id,
    documentId: params.documentId,
  });

  return NextResponse.json(users);
});
