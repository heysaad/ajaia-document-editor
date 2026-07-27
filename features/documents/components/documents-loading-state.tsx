import { Skeleton } from "@/components/ui/skeleton";

export function DocumentsLoadingState() {
  return (
    <div className="space-y-3" aria-label="Loading documents">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="rounded-3xl border border-border/70 bg-card/80 p-5"
        >
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-4 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-2/3" />
          <div className="mt-5 flex gap-2">
            <Skeleton className="h-9 w-20 rounded-xl" />
            <Skeleton className="h-9 w-20 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
