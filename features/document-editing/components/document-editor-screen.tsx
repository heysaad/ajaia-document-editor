"use client";

import type { JSONContent } from "@tiptap/core";
import Bold from "@tiptap/extension-bold";
import BulletList from "@tiptap/extension-bullet-list";
import TiptapDocument from "@tiptap/extension-document";
import Heading from "@tiptap/extension-heading";
import History from "@tiptap/extension-history";
import Italic from "@tiptap/extension-italic";
import ListItem from "@tiptap/extension-list-item";
import OrderedList from "@tiptap/extension-ordered-list";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import Underline from "@tiptap/extension-underline";
import { useEditor } from "@tiptap/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  fetchDocumentSaveClient,
  type DocumentSaveClientPort,
} from "@/features/document-editing/client/document-save-client";
import { useDocumentAutosave } from "@/features/document-editing/client/use-document-autosave";
import type { DocumentDetail } from "@/features/documents/types";
import { fetchJson } from "@/lib/api-client";

import { ConflictBanner } from "./conflict-banner";
import { DocumentEditorHeader } from "./document-editor-header";
import { EditorCanvas } from "./editor-canvas";
import { FormattingToolbar } from "./formatting-toolbar";

type DocumentEditorScreenProps = {
  document: DocumentDetail;
  saveClient?: DocumentSaveClientPort;
};

const TITLE_SAVE_DELAY_MS = 800;

function downloadDraft(title: string, content: JSONContent) {
  const blob = new Blob([JSON.stringify(content, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = `${title.trim() || "unsaved-document"}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function DocumentEditorScreen({
  document,
  saveClient = fetchDocumentSaveClient,
}: DocumentEditorScreenProps) {
  const router = useRouter();
  const [title, setTitle] = useState(document.title);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [isTitleSaving, setIsTitleSaving] = useState(false);
  const titleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRequestRef = useRef<AbortController | null>(null);
  const titleSequenceRef = useRef(0);
  const titleRef = useRef(document.title);

  const autosave = useDocumentAutosave({
    documentId: document.id,
    initialContent: document.contentJson,
    initialVersion: document.version,
    initialSavedAt: document.updatedAt,
    client: saveClient,
  });

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    extensions: [
      TiptapDocument,
      Paragraph,
      Text,
      Heading.configure({ levels: [1, 2, 3] }),
      Bold,
      Italic,
      Underline,
      BulletList,
      OrderedList,
      ListItem,
      History,
    ],
    content: document.contentJson,
    editorProps: {
      attributes: {
        class:
          "ProseMirror min-h-[52vh] max-w-none text-base leading-8 text-foreground outline-none",
        "aria-label": "Document content",
      },
    },
    onUpdate: ({ editor: activeEditor }) => {
      autosave.queueSave(activeEditor.getJSON());
    },
  });

  const persistTitle = useCallback(
    async (nextTitle: string) => {
      const normalized = nextTitle.replace(/\s+/g, " ").trim();
      if (!normalized) {
        setTitleError("Document titles cannot be empty.");
        return;
      }

      titleRequestRef.current?.abort();
      const controller = new AbortController();
      titleRequestRef.current = controller;
      const sequence = ++titleSequenceRef.current;
      setIsTitleSaving(true);
      setTitleError(null);

      try {
        const saved = await fetchJson<DocumentDetail>(
          `/api/documents/${document.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: normalized }),
            signal: controller.signal,
          },
        );
        if (sequence !== titleSequenceRef.current) return;
        titleRef.current = saved.title;
        setTitle(saved.title);
      } catch (error) {
        if (controller.signal.aborted || sequence !== titleSequenceRef.current) {
          return;
        }
        setTitleError(
          error instanceof Error ? error.message : "The title could not be saved.",
        );
      } finally {
        if (sequence === titleSequenceRef.current) setIsTitleSaving(false);
      }
    },
    [document.id],
  );

  function handleTitleChange(nextTitle: string) {
    setTitle(nextTitle);
    setTitleError(null);
    if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
    titleTimerRef.current = setTimeout(() => {
      void persistTitle(nextTitle);
    }, TITLE_SAVE_DELAY_MS);
  }

  useEffect(
    () => () => {
      if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
      titleRequestRef.current?.abort();
    },
    [],
  );

  const ownerLabel = `${document.owner.name} · owner`;

  return (
    <main
      id="main-content"
      className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8"
    >
      <DocumentEditorHeader
        title={title}
        onTitleChange={handleTitleChange}
        onTitleBlur={() => {
          if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
          if (title !== titleRef.current) void persistTitle(title);
        }}
        saveState={isTitleSaving ? "saving" : autosave.state.status}
        lastSavedAt={autosave.state.savedAt}
        version={autosave.state.version}
        ownerLabel={ownerLabel}
        onBack={() => {
          if (title !== titleRef.current) void persistTitle(title);
          autosave.flush();
          router.push("/");
        }}
      />

      {titleError ? (
        <Alert variant="destructive">
          <AlertTitle>Title not saved</AlertTitle>
          <AlertDescription>{titleError}</AlertDescription>
        </Alert>
      ) : null}

      {autosave.state.status === "error" ? (
        <ConflictBanner
          mode="error"
          onPrimaryAction={autosave.retry}
          onSecondaryAction={() => {
            const confirmed = autosave.loadConfirmedCopy();
            editor?.commands.setContent(confirmed);
          }}
        />
      ) : null}

      {autosave.state.status === "conflict" ? (
        <ConflictBanner
          mode="conflict"
          onPrimaryAction={() => {
            const latest = autosave.loadServerCopy();
            if (!latest) return;
            editor?.commands.setContent(latest.contentJson);
            titleRef.current = latest.title;
            setTitle(latest.title);
          }}
          onSecondaryAction={() => {
            if (editor) downloadDraft(title, editor.getJSON());
          }}
        />
      ) : null}

      <FormattingToolbar editor={editor} />
      <EditorCanvas editor={editor} />
    </main>
  );
}
