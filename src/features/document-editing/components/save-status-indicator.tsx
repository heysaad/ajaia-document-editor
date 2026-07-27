import { AlertCircle, CheckCircle2, LoaderCircle, ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { SaveStatus } from "@/features/document-editing/models";

type SaveStatusIndicatorProps = {
  state: SaveStatus;
  lastSavedAt: string | null;
};

const formatter = new Intl.DateTimeFormat("en", {
  hour: "numeric",
  minute: "2-digit",
});

export function SaveStatusIndicator({
  state,
  lastSavedAt,
}: SaveStatusIndicatorProps) {
  if (state === "saving") {
    return (
      <Badge variant="secondary">
        <LoaderCircle className="animate-spin" aria-hidden="true" />
        Saving
      </Badge>
    );
  }

  if (state === "error") {
    return (
      <Badge variant="warning">
        <AlertCircle aria-hidden="true" />
        Save failed
      </Badge>
    );
  }

  if (state === "conflict") {
    return (
      <Badge variant="destructive">
        <ShieldAlert aria-hidden="true" />
        Newer version exists
      </Badge>
    );
  }

  if (state === "saved" && lastSavedAt) {
    return (
      <Badge variant="success">
        <CheckCircle2 aria-hidden="true" />
        Saved at {formatter.format(new Date(lastSavedAt))}
      </Badge>
    );
  }

  return <Badge variant="outline">Unsaved changes</Badge>;
}
