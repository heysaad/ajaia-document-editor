import type {
  SaveAction,
  SaveState,
} from "@/features/document-editing/models";

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
