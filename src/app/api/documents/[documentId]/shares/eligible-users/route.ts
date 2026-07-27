import { NextRequest, NextResponse } from "next/server";

import { resolveSessionUser } from "@/features/auth/server/auth-session";
import { eligibleShareUsersSearchSchema } from "@/features/document-sharing/server/document-share-schemas";
import { documentIdParamSchema } from "@/features/documents/server/document-schemas";
import { appContainer } from "@/infra/di/container";
import { DI_TOKENS } from "@/infra/di/tokens";
import { handleRoute } from "@/infra/http/route";

const documentService = appContainer.resolve(DI_TOKENS.DocumentService);

export const runtime = "nodejs";
const ELIGIBLE_SHARE_USERS_LIMIT = 10;

type DocumentEligibleUsersRouteContext = {
  params: Promise<{ documentId: string }>;
};

export const GET = handleRoute(async (
  request: NextRequest,
  context: DocumentEligibleUsersRouteContext,
) => {
  const viewer = await resolveSessionUser();
  const params = documentIdParamSchema.parse(await context.params);
  const search = eligibleShareUsersSearchSchema.parse({
    q: request.nextUrl.searchParams.get("q") ?? undefined,
  });
  const users = await documentService.listEligibleShareUsers({
    ownerId: viewer.id,
    documentId: params.documentId,
    query: search.q,
    limit: ELIGIBLE_SHARE_USERS_LIMIT,
  });

  return NextResponse.json(users);
});
