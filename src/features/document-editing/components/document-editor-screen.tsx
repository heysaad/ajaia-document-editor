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
import { Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fetchDocumentSaveClient } from "@/features/document-editing/client/FetchDocumentSaveClient";
import type { IDocumentSaveClient } from "@/features/document-editing/client/IDocumentSaveClient";
import { useDocumentAutosave } from "@/features/document-editing/client/use-document-autosave";
import {
  documentContentToMarkdown,
  documentContentToPlainText,
} from "@/features/document-editing/server/document-content";
import { DocumentShareDialog } from "@/features/document-sharing/components/document-share-dialog";
import type { DocumentDetail } from "@/features/documents/models";
import { fetchJson } from "@/lib/api-client";

import { ConflictBanner } from "./conflict-banner";
import { DocumentAccessRevokedAlert } from "./document-access-revoked-alert";
import { DocumentEditorHeader } from "./document-editor-header";
import { EditorCanvas } from "./editor-canvas";
import { FormattingToolbar } from "./formatting-toolbar";

type DocumentEditorScreenProps = {
  document: DocumentDetail;
  saveClient?: IDocumentSaveClient;
};

const TITLE_SAVE_DELAY_MS = 800;

function downloadTextFile(fileName: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function downloadDraft(title: string, content: JSONContent) {
  downloadTextFile(
    `${title.trim() || "unsaved-document"}.json`,
    JSON.stringify(content, null, 2),
    "application/json",
  );
}

function downloadMarkdown(title: string, content: JSONContent) {
  downloadTextFile(
    `${title.trim() || "unsaved-document"}.md`,
    documentContentToMarkdown(content),
    "text/markdown;charset=utf-8",
  );
}

function escapePdfText(value: string) {
  return value.replace(/([\\()])/g, "\\$1");
}

function buildSimplePdf(title: string, content: JSONContent): string {
  const text = documentContentToPlainText(content) || title.trim() || "Untitled document";
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const contentStream = lines
    .map((line, index) => `BT /F1 12 Tf 50 ${760 - index * 14} Td (${escapePdfText(line)}) Tj ET`)
    .join("\n");

  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj",
    `4 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj`,
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj",
  ];

  const pdfChunks: string[] = ["%PDF-1.4\n"];
  const offsets: number[] = [];

  for (const object of objects) {
    offsets.push(pdfChunks.join("").length);
    pdfChunks.push(`${object}\n`);
  }

  const xrefOffset = pdfChunks.join("").length;
  pdfChunks.push(`xref\n0 ${objects.length + 1}\n`);
  pdfChunks.push("0000000000 65535 f \n");
  for (const offset of offsets) {
    pdfChunks.push(`${String(offset).padStart(10, "0")} 00000 n \n`);
  }
  pdfChunks.push(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`);
  pdfChunks.push(`startxref\n${xrefOffset}\n%%EOF\n`);

  return pdfChunks.join("");
}

function downloadPdf(title: string, content: JSONContent) {
  const pdf = buildSimplePdf(title, content);
  downloadTextFile(`${title.trim() || "unsaved-document"}.pdf`, pdf, "application/pdf");
}

export function DocumentEditorScreen({
  document,
  saveClient = fetchDocumentSaveClient,
}: DocumentEditorScreenProps) {
  const router = useRouter();
  const accessRole = document.accessRole ?? "OWNER";
  const isOwner = accessRole === "OWNER";
  const [title, setTitle] = useState(document.title);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [isTitleSaving, setIsTitleSaving] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
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
    editable: true,
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
      if (!isOwner) {
        return;
      }

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
        if (sequence !== titleSequenceRef.current) {
          return;
        }
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
        if (sequence === titleSequenceRef.current) {
          setIsTitleSaving(false);
        }
      }
    },
    [document.id, isOwner],
  );

  function handleTitleChange(nextTitle: string) {
    setTitle(nextTitle);
    setTitleError(null);
    if (titleTimerRef.current) {
      clearTimeout(titleTimerRef.current);
    }
    titleTimerRef.current = setTimeout(() => {
      void persistTitle(nextTitle);
    }, TITLE_SAVE_DELAY_MS);
  }

  useEffect(
    () => () => {
      if (titleTimerRef.current) {
        clearTimeout(titleTimerRef.current);
      }
      titleRequestRef.current?.abort();
    },
    [],
  );

  const isAccessRevoked = autosave.state.status === "revoked";
  const ownerLabel = `Owner: ${document.owner.name}`;
  const accessRoleLabel = isOwner ? "Owner access" : "Shared editor";

  useEffect(() => {
    editor?.setEditable(!isAccessRevoked);
  }, [editor, isAccessRevoked]);

  return (
    <main
      id="main-content"
      className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8"
    >
      <DocumentEditorHeader
        title={title}
        onTitleChange={handleTitleChange}
        onTitleBlur={() => {
          if (titleTimerRef.current) {
            clearTimeout(titleTimerRef.current);
          }
          if (isOwner && title !== titleRef.current) {
            void persistTitle(title);
          }
        }}
        saveState={
          isTitleSaving && !isAccessRevoked ? "saving" : autosave.state.status
        }
        lastSavedAt={autosave.state.savedAt}
        version={autosave.state.version}
        ownerLabel={ownerLabel}
        accessRoleLabel={accessRoleLabel}
        isTitleEditable={isOwner}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" size="sm" variant="outline">
                  <Download aria-hidden="true" className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onSelect={() => {
                    if (editor) {
                      downloadMarkdown(title, editor.getJSON());
                    }
                  }}
                >
                  Download Markdown
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    if (editor) {
                      downloadPdf(title, editor.getJSON());
                    }
                  }}
                >
                  Download PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {isOwner ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setIsShareDialogOpen(true)}
              >
                Manage access
              </Button>
            ) : null}
          </div>
        }
        onBack={() => {
          if (isOwner && title !== titleRef.current) {
            void persistTitle(title);
          }
          void autosave.flush();
          router.push("/");
        }}
      />

      {titleError && isOwner ? (
        <Alert variant="destructive">
          <AlertTitle>Title not saved</AlertTitle>
          <AlertDescription>{titleError}</AlertDescription>
        </Alert>
      ) : null}

      {isAccessRevoked ? (
        <DocumentAccessRevokedAlert
          message={
            autosave.state.message ??
            "Your access to this document is no longer available."
          }
          onBack={() => router.push("/")}
        />
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
            if (!latest) {
              return;
            }
            editor?.commands.setContent(latest.contentJson);
            titleRef.current = latest.title;
            setTitle(latest.title);
          }}
          onSecondaryAction={() => {
            if (editor) {
              downloadDraft(title, editor.getJSON());
            }
          }}
        />
      ) : null}

      <FormattingToolbar editor={editor} disabled={isAccessRevoked} />
      <EditorCanvas editor={editor} />

      {isOwner ? (
        <DocumentShareDialog
          open={isShareDialogOpen}
          onOpenChange={setIsShareDialogOpen}
          documentId={document.id}
          documentTitle={document.title}
        />
      ) : null}
    </main>
  );
}
