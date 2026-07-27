import type { DocumentDetail } from "@/features/documents/models";

export type SaveStatus =
  | "saved"
  | "dirty"
  | "saving"
  | "error"
  | "conflict"
  | "revoked";

export interface SaveState {
  status: SaveStatus;
  version: number;
  savedAt: string | null;
  message: string | null;
  latestServerDocument: DocumentDetail | null;
}

export type SaveAction =
  | { type: "edited" }
  | { type: "save_started" }
  | { type: "save_succeeded"; version: number; savedAt: string }
  | { type: "save_failed"; message: string }
  | { type: "access_revoked"; message: string }
  | { type: "conflict"; latestServerDocument: DocumentDetail }
  | { type: "retry" }
  | { type: "server_copy_loaded"; version: number; savedAt: string };
