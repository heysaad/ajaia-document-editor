import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type DocumentsErrorStateProps = {
  onRetry?: () => void;
};

export function DocumentsErrorState({ onRetry }: DocumentsErrorStateProps) {
  return (
    <Alert variant="destructive">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 size-4" aria-hidden="true" />
        <div className="flex-1">
          <AlertTitle>Documents failed to load</AlertTitle>
          <AlertDescription>
            Keep the error inline so the reviewer does not lose the surrounding context or keyboard position.
          </AlertDescription>
          {onRetry ? (
            <Button className="mt-4" size="sm" variant="outline" onClick={onRetry}>
              Try again
            </Button>
          ) : null}
        </div>
      </div>
    </Alert>
  );
}
