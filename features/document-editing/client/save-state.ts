import type { DocumentDetail } from "@/features/documents/models";

export type SaveStatus = "saved" | "dirty" | "saving" | "error" | "conflict";

export type SaveState = {
  status: SaveStatus;
  version: number;
  savedAt: string | null;
  message: string | null;
  latestServerDocument: DocumentDetail | null;
};

export type SaveAction =
  | { type: "edited" }
  | { type: "save_started" }
  | { type: "save_succeeded"; version: number; savedAt: string }
  | { type: "save_failed"; message: string }
  | { type: "conflict"; latestServerDocument: DocumentDetail }
  | { type: "retry" }
  | { type: "server_copy_loaded"; version: number; savedAt: string };

export function createInitialSaveState(
  version: number,
  savedAt: string | null,
): SaveState {
  return {
    status: "saved",
    version,
    savedAt,
    message: null,
    latestServerDocument: null,
  };
}

export function saveStateReducer(
  state: SaveState,
  action: SaveAction,
): SaveState {
  switch (action.type) {
    case "edited":
      return state.status === "conflict"
        ? state
        : { ...state, status: "dirty", message: null };
    case "save_started":
    case "retry":
      return { ...state, status: "saving", message: null };
    case "save_succeeded":
      return {
        status: "saved",
        version: action.version,
        savedAt: action.savedAt,
        message: null,
        latestServerDocument: null,
      };
    case "save_failed":
      return { ...state, status: "error", message: action.message };
    case "conflict":
      return {
        ...state,
        status: "conflict",
        message: "A newer copy of this document is available.",
        latestServerDocument: action.latestServerDocument,
      };
    case "server_copy_loaded":
      return {
        status: "saved",
        version: action.version,
        savedAt: action.savedAt,
        message: null,
        latestServerDocument: null,
      };
  }
}
