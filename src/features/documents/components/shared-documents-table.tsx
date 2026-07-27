import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DashboardDocumentSummary } from "@/features/documents/models";

type SharedDocumentsTableProps = {
  documents: DashboardDocumentSummary[];
};

const formatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function SharedDocumentsTable({
  documents,
}: SharedDocumentsTableProps) {
  return (
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
                <div className="space-y-3">
                  <Badge variant="secondary">Shared</Badge>
                  <Link
                    href={`/documents/${document.id}`}
                    className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <span className="block text-base font-semibold text-foreground">
                      {document.title}
                    </span>
                  </Link>
                  <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                    {document.excerpt || "This shared document is ready for more edits."}
                  </p>
                </div>
              </td>
              <td className="px-6 py-5 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{document.owner.name}</p>
                <p className="mt-1">{document.owner.email}</p>
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
  );
}
