import { getOptionalSessionUser } from "@/features/auth/server/auth-session";
import { SEEDED_USERS } from "@/features/auth/server/seeded-users";
import { documentService } from "@/features/documents/server/document-service.server";
import { DocumentDashboard } from "@/features/documents/components/document-dashboard";

export default async function Home() {
  const viewer = await getOptionalSessionUser();
  const documents = viewer
    ? await documentService.listOwnedDocuments({
        ownerId: viewer.id,
        limit: 12,
      })
    : { items: [] };

  return (
    <DocumentDashboard
      key={viewer?.id ?? "no-viewer"}
      users={SEEDED_USERS}
      viewer={viewer}
      initialDocuments={documents.items}
    />
  );
}
