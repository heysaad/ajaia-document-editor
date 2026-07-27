import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DocumentEditorLoading() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-12 w-full max-w-xl" />
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="size-10 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-[420px] w-full" />
        </CardContent>
      </Card>
    </main>
  );
}
