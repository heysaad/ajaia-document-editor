import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  DashboardDocumentSummary,
  DocumentPaginationInfo,
} from "@/features/documents/models";

import { DocumentPaginationControls } from "./document-pagination-controls";

type SharedDocumentsTableProps = {
  documents: DashboardDocumentSummary[];
  pagination: DocumentPaginationInfo;
  isPaginationLoading?: boolean;
  onPageChange: (page: number) => void;
};

const formatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function SharedDocumentsTable({
  documents,
  pagination,
  isPaginationLoading = false,
  onPageChange,
}: SharedDocumentsTableProps) {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead className="border-b border-border/70">
            <tr className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              <th className="px-6 py-4 font-medium">Document</th>
              <th className="px-6 py-4 font-medium">Owner</th>
              <th className="px-6 py-4 font-medium">Updated</th>
              <th className="px-6 py-4 font-medium">Version</th>
              <th className="px-6 py-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((document) => (
              <tr
                key={document.id}
                data-document-id={document.id}
                className="border-b border-border/60 align-top last:border-b-0"
              >
                <td className="px-6 py-5">
                  <Link
                    href={`/documents/${document.id}`}
                    className="block rounded-lg text-base font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    {document.title}
                  </Link>
                </td>
                <td className="px-6 py-5 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">
                    {document.owner?.name ?? "Unknown owner"}
                  </p>
                  <p className="mt-1">{document.owner?.email ?? "Unknown email"}</p>
                </td>
                <td className="px-6 py-5 text-sm text-muted-foreground">
                  {formatter.format(new Date(document.updatedAt))}
                </td>
                <td className="px-6 py-5">
                  <Badge variant="secondary">v{document.version}</Badge>
                </td>
                <td className="px-6 py-5">
                  <Button size="sm" variant="ghost" asChild>
                    <Link href={`/documents/${document.id}`}>Open</Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DocumentPaginationControls
        pagination={pagination}
        isLoading={isPaginationLoading}
        onPageChange={onPageChange}
      />
    </>
  );
}
