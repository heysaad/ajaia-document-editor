import { NextRequest, NextResponse } from "next/server";

import { resolveSessionUser } from "@/features/auth/server/auth-session";
import {
  createDocumentSchema,
  listDocumentsSearchSchema,
} from "@/features/documents/server/document-schemas";
import { appContainer } from "@/infra/di/container";
import { DI_TOKENS } from "@/infra/di/tokens";
import { handleRoute, parseJsonBody } from "@/infra/http/route";

const documentService = appContainer.resolve(DI_TOKENS.DocumentService);

export const runtime = "nodejs";

export const GET = handleRoute(async (request: NextRequest) => {
  const viewer = await resolveSessionUser();
  const query = listDocumentsSearchSchema.parse({
    ownedCursor: request.nextUrl.searchParams.get("ownedCursor") ?? undefined,
    sharedCursor: request.nextUrl.searchParams.get("sharedCursor") ?? undefined,
    limit: request.nextUrl.searchParams.get("limit") ?? undefined,
  });

  const documents = await documentService.listDashboardDocuments({
    viewerId: viewer.id,
    ownedCursor: query.ownedCursor,
    sharedCursor: query.sharedCursor,
    limit: query.limit,
  });

  return NextResponse.json(documents);
});

export const POST = handleRoute(async (request: Request) => {
  const viewer = await resolveSessionUser();
  const body = await parseJsonBody(request, createDocumentSchema);
  const document = await documentService.createDocument({
    ownerId: viewer.id,
    title: body.title,
  });

  return NextResponse.json(document, { status: 201 });
});
