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
};

export function DocumentEmptyState({
  isCreating = false,
  onCreate,
}: DocumentEmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <FilePlus2 aria-hidden="true" />
        </div>
        <CardTitle>No owned documents yet</CardTitle>
        <CardDescription>
          Create a first draft for this demo user. The empty state keeps the
          primary action in the same focus order as the list view.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button disabled={isCreating} onClick={onCreate}>
          {isCreating ? "Creating..." : "Create untitled document"}
        </Button>
      </CardContent>
    </Card>
  );
}
