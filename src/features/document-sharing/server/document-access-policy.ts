import type { DocumentAccessRole, DocumentViewerRecord } from "@/features/documents/models";

export type DocumentAccessState = "owner" | "shared_editor" | "none";

export function resolveDocumentAccess(
  document: Pick<DocumentViewerRecord, "ownerId" | "viewerShareRole">,
  viewerId: string,
): DocumentAccessState {
  if (document.ownerId === viewerId) {
    return "owner";
  }

  if (document.viewerShareRole === "EDITOR") {
    return "shared_editor";
  }

  return "none";
}

export function toDocumentAccessRole(
  accessState: Exclude<DocumentAccessState, "none">,
): DocumentAccessRole {
  return accessState === "owner" ? "OWNER" : "EDITOR";
}
