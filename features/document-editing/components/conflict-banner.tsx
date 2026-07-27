import { AlertTriangle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type ConflictBannerProps = {
  mode: "error" | "conflict";
  onPrimaryAction: () => void;
  onSecondaryAction: () => void;
};

export function ConflictBanner({
  mode,
  onPrimaryAction,
  onSecondaryAction,
}: ConflictBannerProps) {
  if (mode === "error") {
    return (
      <Alert variant="warning">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-4" aria-hidden="true" />
          <div className="flex-1">
            <AlertTitle>Save failed. Local edits are still on this page.</AlertTitle>
            <AlertDescription>
              Retry keeps the current draft intact. Reloading the last confirmed
              server copy will discard unsaved local changes.
            </AlertDescription>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" onClick={onPrimaryAction}>
                Retry save
              </Button>
              <Button size="sm" variant="outline" onClick={onSecondaryAction}>
                Reload last saved copy
              </Button>
            </div>
          </div>
        </div>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-4" aria-hidden="true" />
        <div className="flex-1">
          <AlertTitle>A newer server version exists.</AlertTitle>
          <AlertDescription>
            Autosave is paused. Download the local draft or reload the latest
            server copy before editing continues.
          </AlertDescription>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant="destructive" onClick={onPrimaryAction}>
              Reload server copy
            </Button>
            <Button size="sm" variant="outline" onClick={onSecondaryAction}>
              Download local draft
            </Button>
          </div>
        </div>
      </div>
    </Alert>
  );
}
