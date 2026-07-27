import { redirect } from "next/navigation";

import { getOptionalSessionUser } from "@/features/auth/server/auth-session";
import { documentService } from "@/features/documents/server/document-service.server";
import { DocumentDashboard } from "@/features/documents/components/document-dashboard";

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
