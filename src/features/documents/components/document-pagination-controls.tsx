"use client";

import { Button } from "@/components/ui/button";
import type { DocumentPaginationInfo } from "@/features/documents/models";

type DocumentPaginationControlsProps = {
  pagination: DocumentPaginationInfo;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
};

function getVisiblePages(page: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const visible = new Set<number>([1, totalPages, page - 1, page, page + 1]);

  return Array.from(visible)
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((left, right) => left - right);
}

export function DocumentPaginationControls({
  pagination,
  isLoading = false,
  onPageChange,
}: DocumentPaginationControlsProps) {
  const visiblePages = getVisiblePages(pagination.page, pagination.totalPages);

  return (
    <div className="flex flex-col gap-3 border-t border-border/70 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="text-sm text-muted-foreground">
        Page {pagination.page} of {pagination.totalPages} · {pagination.totalItems} documents
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={isLoading || !pagination.hasPreviousPage}
          onClick={() => onPageChange(pagination.page - 1)}
        >
          Previous
        </Button>

        {visiblePages.map((page, index) => {
          const previousPage = visiblePages[index - 1];
          const shouldInsertEllipsis =
            previousPage !== undefined && page - previousPage > 1;

          return (
            <span key={page} className="flex items-center gap-2">
              {shouldInsertEllipsis ? (
                <span aria-hidden="true" className="px-1 text-sm text-muted-foreground">
                  ...
                </span>
              ) : null}
              <Button
                size="sm"
                variant={page === pagination.page ? "default" : "outline"}
                disabled={isLoading}
                aria-current={page === pagination.page ? "page" : undefined}
                onClick={() => onPageChange(page)}
              >
                {page}
              </Button>
            </span>
          );
        })}

        <Button
          size="sm"
          variant="outline"
          disabled={isLoading || !pagination.hasNextPage}
          onClick={() => onPageChange(pagination.page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}