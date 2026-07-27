import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { SaveStatus } from "@/features/document-editing/models";

import { DocumentTitleField } from "./document-title-field";
import { SaveStatusIndicator } from "./save-status-indicator";

type DocumentEditorHeaderProps = {
  title: string;
  onTitleChange: (value: string) => void;
  onTitleBlur?: () => void;
  saveState: SaveStatus;
  lastSavedAt: string | null;
  version: number;
  ownerLabel: string;
  onBack: () => void;
};

export function DocumentEditorHeader({
  title,
  onTitleChange,
  onTitleBlur,
  saveState,
  lastSavedAt,
  version,
  ownerLabel,
  onBack,
}: DocumentEditorHeaderProps) {
  return (
    <header className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="ghost"
          className="px-0 text-sm text-muted-foreground hover:bg-transparent"
          onClick={onBack}
        >
          <ArrowLeft aria-hidden="true" />
          Back to documents
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {ownerLabel}
          </p>
          <SaveStatusIndicator state={saveState} lastSavedAt={lastSavedAt} />
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            v{version}
          </p>
        </div>
      </div>
      <DocumentTitleField
        value={title}
        onChange={onTitleChange}
        onBlur={onTitleBlur}
      />
    </header>
  );
}
