import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 items-center px-4 py-16 sm:px-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Document not found</CardTitle>
          <CardDescription>
            This document may have been removed, or it belongs to a different
            demo user.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/">Return to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
