import { getOptionalDemoUser } from "@/features/auth/server/auth-session";
import { DEMO_USERS } from "@/features/auth/server/demo-users";
import { documentService } from "@/features/documents/server/document-service.server";
import { DocumentDashboard } from "@/features/documents/components/document-dashboard";

export default async function Home() {
  const viewer = await getOptionalDemoUser();
  const documents = viewer
    ? await documentService.listOwnedDocuments({
        ownerId: viewer.id,
        limit: 12,
      })
    : { items: [] };

  return (
    <DocumentDashboard
      key={viewer?.id ?? "no-viewer"}
      users={DEMO_USERS}
      viewer={viewer}
      initialDocuments={documents.items}
    />
  );
}
