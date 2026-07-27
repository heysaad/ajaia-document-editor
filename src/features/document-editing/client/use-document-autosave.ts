"use client";

import type { JSONContent } from "@tiptap/core";
import { useCallback, useEffect, useReducer, useRef } from "react";

import type { DocumentDetail } from "@/features/documents/models";
import { ApiClientError } from "@/lib/api-client";

import type { IDocumentSaveClient } from "./IDocumentSaveClient";
import {
  createInitialSaveState,
  saveStateReducer,
} from "./save-state";

const AUTOSAVE_DELAY_MS = 800;

type UseDocumentAutosaveInput = {
  documentId: string;
  initialContent: JSONContent;
  initialVersion: number;
  initialSavedAt: string;
  client: IDocumentSaveClient;
};

export function useDocumentAutosave({
  documentId,
  initialContent,
  initialVersion,
  initialSavedAt,
  client,
}: UseDocumentAutosaveInput) {
  const [state, dispatch] = useReducer(
    saveStateReducer,
    createInitialSaveState(initialVersion, initialSavedAt),
  );
  const stateRef = useRef(state);
  const pendingContentRef = useRef<JSONContent>(initialContent);
  const confirmedContentRef = useRef<JSONContent>(initialContent);
  const versionRef = useRef(initialVersion);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const sequenceRef = useRef(0);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const persist = useCallback(
    async (content: JSONContent) => {
      if (
        stateRef.current.status === "conflict" ||
        stateRef.current.status === "revoked"
      ) {
        return;
      }

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      requestRef.current?.abort();
      const controller = new AbortController();
      requestRef.current = controller;
      const sequence = ++sequenceRef.current;
      dispatch({ type: "save_started" });

      try {
        const saved = await client.save(
          documentId,
          content,
          versionRef.current,
          controller.signal,
        );

        if (sequence !== sequenceRef.current) return;

        versionRef.current = saved.version;
        confirmedContentRef.current = saved.contentJson;
        dispatch({
          type: "save_succeeded",
          version: saved.version,
          savedAt: saved.updatedAt,
        });
      } catch (error) {
        if (controller.signal.aborted || sequence !== sequenceRef.current) return;

        if (error instanceof ApiClientError && error.code === "conflict") {
          const details = error.details as
            | { latestDocument?: DocumentDetail }
            | undefined;
          if (details?.latestDocument) {
            dispatch({
              type: "conflict",
              latestServerDocument: details.latestDocument,
            });
            return;
          }
        }

        if (
          error instanceof ApiClientError &&
          (error.code === "forbidden" || error.code === "not_found")
        ) {
          dispatch({
            type: "access_revoked",
            message:
              "Your access to this document is no longer available. Return to the dashboard to continue.",
          });
          return;
        }

        dispatch({
          type: "save_failed",
          message:
            error instanceof Error
              ? error.message
              : "Your changes could not be saved.",
        });
      }
    },
    [client, documentId],
  );

  const queueSave = useCallback(
    (content: JSONContent) => {
      pendingContentRef.current = content;
      if (
        stateRef.current.status === "conflict" ||
        stateRef.current.status === "revoked"
      ) {
        return;
      }

      dispatch({ type: "edited" });
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        await persist(pendingContentRef.current);
      }, AUTOSAVE_DELAY_MS);
    },
    [persist],
  );

  const retry = useCallback(() => {
    dispatch({ type: "retry" });
    return persist(pendingContentRef.current);
  }, [persist]);

  const flush = useCallback(() => {
    if (
      stateRef.current.status === "dirty" ||
      stateRef.current.status === "error"
    ) {
      return persist(pendingContentRef.current);
    }
    return Promise.resolve();
  }, [persist]);

  const loadServerCopy = useCallback(() => {
    const latest = stateRef.current.latestServerDocument;
    if (!latest) return null;

    requestRef.current?.abort();
    versionRef.current = latest.version;
    pendingContentRef.current = latest.contentJson;
    confirmedContentRef.current = latest.contentJson;
    dispatch({
      type: "server_copy_loaded",
      version: latest.version,
      savedAt: latest.updatedAt,
    });
    return latest;
  }, []);

  const loadConfirmedCopy = useCallback(() => {
    requestRef.current?.abort();
    pendingContentRef.current = confirmedContentRef.current;
    dispatch({
      type: "server_copy_loaded",
      version: versionRef.current,
      savedAt: stateRef.current.savedAt ?? initialSavedAt,
    });
    return confirmedContentRef.current;
  }, [initialSavedAt]);

  useEffect(() => {
    const handlePageHide = () => void flush();
    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      if (timerRef.current) clearTimeout(timerRef.current);
      requestRef.current?.abort();
    };
  }, [flush]);

  return {
    state,
    queueSave,
    retry,
    flush,
    loadServerCopy,
    loadConfirmedCopy,
  };
}
