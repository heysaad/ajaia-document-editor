import Link from "next/link";
import { FileText } from "lucide-react";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <main
      id="main-content"
      className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6"
    >
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-6 flex items-center justify-center gap-2 text-sm font-semibold text-foreground"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <FileText className="size-4" aria-hidden="true" />
          </span>
          Ajai Docs
        </Link>
        <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
          <div className="mt-7">{children}</div>
          {footer ? (
            <div className="mt-6 border-t border-border/70 pt-5 text-center text-sm text-muted-foreground">
              {footer}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
