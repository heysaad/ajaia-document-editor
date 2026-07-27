import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DocumentDashboard } from "@/features/documents/components/document-dashboard";
import type { DocumentSummary } from "@/features/documents/models";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mocks.push,
    replace: mocks.replace,
    refresh: mocks.refresh,
  }),
}));

vi.mock("@/features/auth/client/auth-client", () => ({
  authClient: {
    signOut: mocks.signOut,
  },
}));

const viewer = {
  id: "771f2b30-3b0c-40d8-a96f-6c2ded9e70a1",
  name: "Maya Patel",
  email: "maya@example.com",
};

const documents: DocumentSummary[] = [
  {
    id: "5c301301-2b15-47ec-ae55-b0f3ac3bcf51",
    title: "Release brief",
    excerpt: "A concise preview",
    version: 3,
    updatedAt: "2026-07-27T10:00:00.000Z",
  },
];

describe("DocumentDashboard", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
  });

  it("renders the requested table-style homepage without dashboard stats", () => {
    render(
      <DocumentDashboard viewer={viewer} initialDocuments={documents} />,
    );

    expect(
      screen.getByRole("button", { name: "Add document" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Import file" }),
    ).toBeVisible();
    expect(screen.getByRole("table")).toBeVisible();
    expect(screen.getByText("Document library")).toBeVisible();
    expect(screen.getByText("Owned by me")).toBeVisible();
    expect(screen.queryByText("Default save mode")).not.toBeInTheDocument();
    expect(screen.queryByText("Pick up where you left off.")).not.toBeInTheDocument();
  });

  it("keeps create and import actions visible in the empty state", () => {
    render(<DocumentDashboard viewer={viewer} initialDocuments={[]} />);

    expect(screen.getByText("No owned documents yet")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Create untitled document" }),
    ).toBeVisible();
    expect(
      screen.getAllByRole("button", { name: "Import file" }).length,
    ).toBeGreaterThan(0);
  });
});
