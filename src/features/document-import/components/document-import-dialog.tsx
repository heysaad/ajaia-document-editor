"use client";

import { FileUp, LoaderCircle, Upload, XCircle } from "lucide-react";
import { useId, useRef, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { DocumentDetail } from "@/features/documents/models";
import { fetchJson } from "@/lib/api-client";

import {
  DOCUMENT_IMPORT_ACCEPT,
  DOCUMENT_IMPORT_MAX_BYTES,
  DOCUMENT_IMPORT_SIZE_LABEL,
  DOCUMENT_IMPORT_SUPPORTED_LABEL,
  getDocumentImportErrorMessage,
  validateDocumentImportSelection,
} from "../client/document-import-errors";

type DocumentImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: (document: DocumentDetail) => void;
};

function formatBytes(bytes: number) {
  if (bytes >= 1_048_576) {
    return `${(bytes / 1_048_576).toFixed(2)} MiB`;
  }

  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)} KiB`;
  }

  return `${bytes} bytes`;
}

export function DocumentImportDialog({
  open,
  onOpenChange,
  onImported,
}: DocumentImportDialogProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  function resetState() {
    setSelectedFile(null);
    setErrorMessage(null);
    setIsPending(false);
    setIsDragActive(false);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && !isPending) {
      resetState();
    }
    onOpenChange(nextOpen);
  }

  function selectFiles(files: FileList | File[]) {
    const items = Array.from(files);
    setErrorMessage(null);

    if (items.length !== 1) {
      setSelectedFile(null);
      setErrorMessage("Import one file at a time.");
      return;
    }

    const [file] = items;
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const validationMessage = validateDocumentImportSelection(file);
    setSelectedFile(file);
    setErrorMessage(validationMessage);
  }

  async function handleImport() {
    if (!selectedFile) {
      setErrorMessage("Choose a .txt or .md file before importing.");
      return;
    }

    const validationMessage = validateDocumentImportSelection(selectedFile);
    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setErrorMessage(null);
    setIsPending(true);

    try {
      const document = await fetchJson<DocumentDetail>("/api/documents/import", {
        method: "POST",
        body: formData,
      });
      resetState();
      onOpenChange(false);
      onImported(document);
    } catch (error) {
      setErrorMessage(getDocumentImportErrorMessage(error));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Import a text or Markdown file"
      description="Import creates a new document. The original upload is not kept after conversion."
      initialFocusRef={inputRef}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!selectedFile || isPending}
            onClick={() => void handleImport()}
          >
            {isPending ? (
              <>
                <LoaderCircle className="animate-spin" aria-hidden="true" />
                Importing...
              </>
            ) : (
              <>
                <FileUp aria-hidden="true" />
                Import file
              </>
            )}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
          <p className="font-medium text-foreground">Supported files</p>
          <p className="mt-2">
            {DOCUMENT_IMPORT_SUPPORTED_LABEL} only. {DOCUMENT_IMPORT_SIZE_LABEL}.
            Embedded HTML and unsupported Markdown are flattened into safe text.
          </p>
        </div>

        <div
          className={[
            "rounded-2xl border border-dashed p-5 transition-colors",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-border/80 bg-background",
          ].join(" ")}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragActive(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
              return;
            }
            setIsDragActive(false);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragActive(true);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragActive(false);
            selectFiles(event.dataTransfer.files);
          }}
        >
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Upload aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <label
                htmlFor={inputId}
                className="text-sm font-medium text-foreground"
              >
                Choose one file to import
              </label>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Drag and drop a file here, or browse from your device.
              </p>
              <Input
                ref={inputRef}
                id={inputId}
                type="file"
                accept={DOCUMENT_IMPORT_ACCEPT}
                data-autofocus
                className="mt-4 h-auto cursor-pointer py-3"
                disabled={isPending}
                onChange={(event) => {
                  if (event.target.files) {
                    selectFiles(event.target.files);
                  }
                }}
              />
            </div>
          </div>
        </div>

        {selectedFile ? (
          <div className="rounded-2xl border border-border/70 bg-background p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {selectedFile.name}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatBytes(selectedFile.size)}
                  {selectedFile.size > DOCUMENT_IMPORT_MAX_BYTES
                    ? " - exceeds the size limit"
                    : ""}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={isPending}
                onClick={() => {
                  setSelectedFile(null);
                  setErrorMessage(null);
                  if (inputRef.current) {
                    inputRef.current.value = "";
                  }
                }}
              >
                <XCircle aria-hidden="true" />
                Remove
              </Button>
            </div>
          </div>
        ) : null}

        {errorMessage ? (
          <Alert variant="destructive">
            <AlertTitle>Import failed</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        <p aria-live="polite" className="text-sm text-muted-foreground">
          {isPending
            ? "Importing the selected file and preparing a new editable document."
            : "Importing opens the new document editor when conversion succeeds."}
        </p>
      </div>
    </Dialog>
  );
}
