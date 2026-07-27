import { redirect } from "next/navigation";

import { getOptionalSessionUser } from "@/features/auth/server/auth-session";
import { appContainer } from "@/infra/di/container";
import { DI_TOKENS } from "@/infra/di/tokens";
import { DocumentDashboard } from "@/features/documents/components/document-dashboard";

const documentService = appContainer.resolve(DI_TOKENS.DocumentService);

export default async function Home() {
  const viewer = await getOptionalSessionUser();
  if (!viewer) {
    redirect("/login");
  }

  const documents = await documentService.listOwnedDocuments({
    ownerId: viewer.id,
    limit: 12,
  });

  return (
    <DocumentDashboard
      key={viewer.id}
      viewer={viewer}
      initialDocuments={documents.items}
    />
  );
}
