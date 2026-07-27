import type { Metadata } from "next";
import { Fira_Code, Fira_Sans } from "next/font/google";
import "./globals.css";

const firaSans = Fira_Sans({
  variable: "--font-fira-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "AJAIA Docs",
  description: "Create, edit, and safely save rich-text documents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${firaSans.variable} ${firaCode.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        <a
          href="#main-content"
          className="sr-only absolute left-4 top-4 z-50 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background focus:not-sr-only"
        >
          Skip to main content
        </a>
        <div className="flex min-h-full flex-col">{children}</div>
      </body>
    </html>
  );
}
