import { FilePlus2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type DocumentEmptyStateProps = {
  isCreating?: boolean;
  onCreate: () => void;
  onImportRequest?: () => void;
};

export function DocumentEmptyState({
  isCreating = false,
  onCreate,
  onImportRequest,
}: DocumentEmptyStateProps) {
  return (
    <Card className="border-dashed shadow-none">
      <CardHeader>
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <FilePlus2 aria-hidden="true" />
        </div>
        <CardTitle>No owned documents yet</CardTitle>
        <CardDescription>
          Create a first draft or import a supported text file. The primary
          actions stay in the same focus order as the populated table view.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button disabled={isCreating} onClick={onCreate}>
          {isCreating ? "Creating..." : "Create untitled document"}
        </Button>
        {onImportRequest ? (
          <Button variant="outline" onClick={onImportRequest}>
            Import file
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
