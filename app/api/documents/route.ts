import { NextRequest, NextResponse } from "next/server";

import { identityService } from "@/features/auth/server/identity-service.server";
import {
  createDocumentSchema,
  listDocumentsSearchSchema,
} from "@/features/documents/server/document-schemas";
import { documentService } from "@/features/documents/server/document-service.server";
import { parseJsonBody, toErrorResponse } from "@/infra/http/route";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const viewer = await identityService.resolveViewerIdentity();
    const query = listDocumentsSearchSchema.parse({
      cursor: request.nextUrl.searchParams.get("cursor") ?? undefined,
      limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    });

    const documents = await documentService.listOwnedDocuments({
      ownerId: viewer.id,
      cursor: query.cursor,
      limit: query.limit,
    });

    return NextResponse.json(documents);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const viewer = await identityService.resolveViewerIdentity();
    const body = await parseJsonBody(request, createDocumentSchema);
    const document = await documentService.createDocument({
      ownerId: viewer.id,
      title: body.title,
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
