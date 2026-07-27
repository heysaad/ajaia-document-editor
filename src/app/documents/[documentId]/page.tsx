import { notFound, redirect } from "next/navigation";

import { getOptionalSessionUser } from "@/features/auth/server/auth-session";
import { DocumentEditorScreen } from "@/features/document-editing/components/document-editor-screen";
import { appContainer } from "@/infra/di/container";
import { DI_TOKENS } from "@/infra/di/tokens";
import { AppError } from "@/lib/application-errors";

const documentService = appContainer.resolve(DI_TOKENS.DocumentService);

type DocumentPageProps = {
  params: Promise<{ documentId: string }>;
};

async function getOwnedDocument(ownerId: string, documentId: string) {
  try {
    return await documentService.getOwnedDocument({
      ownerId,
      documentId,
    });
  } catch (error) {
    if (
      error instanceof AppError &&
      (error.code === "not_found" || error.code === "forbidden")
    ) {
      notFound();
    }
    throw error;
  }
}

export default async function DocumentPage({ params }: DocumentPageProps) {
  const viewer = await getOptionalSessionUser();
  if (!viewer) redirect("/login");

  const { documentId } = await params;
  const document = await getOwnedDocument(viewer.id, documentId);

  return <DocumentEditorScreen document={document} />;
}
