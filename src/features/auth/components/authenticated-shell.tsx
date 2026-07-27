import Link from "next/link";
import { FileText } from "lucide-react";

import { ProfileDropdown } from "./profile-dropdown";

type AuthenticatedShellProps = {
  viewer: {
    name: string;
    email: string;
  };
  children: React.ReactNode;
};

export function AuthenticatedShell({ viewer, children }: AuthenticatedShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(87,91,232,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(87,91,232,0.08),transparent_24%)]">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 font-semibold text-foreground">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <FileText className="size-5" aria-hidden="true" />
            </span>
            <span className="hidden sm:block">
              <span className="block text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Workspace
              </span>
              <span className="block text-base leading-tight">Ajai Docs</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <ProfileDropdown name={viewer.name} email={viewer.email} />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}