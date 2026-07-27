import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DocumentDashboard } from "@/features/documents/components/document-dashboard";
import type { DocumentDashboardData } from "@/features/documents/models";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mocks.push,
    replace: mocks.replace,
    refresh: mocks.refresh,
  }),
}));

const dashboardData: DocumentDashboardData = {
  owned: {
    items: [
      {
        id: "5c301301-2b15-47ec-ae55-b0f3ac3bcf51",
        title: "Release brief",
        excerpt: "A concise preview",
        version: 3,
        updatedAt: "2026-07-27T10:00:00.000Z",
        accessRole: "OWNER",
        owner: {
          id: "u1",
          name: "Maya Patel",
          email: "maya@example.com",
        },
      },
    ],
    nextCursor: null,
  },
  shared: {
    items: [
      {
        id: "79fa3121-2b15-47ec-ae55-b0f3ac3bcf52",
        title: "Shared outline",
        excerpt: "Edited with the review team",
        version: 8,
        updatedAt: "2026-07-27T11:00:00.000Z",
        accessRole: "EDITOR",
        owner: {
          id: "u2",
          name: "Rae Thomas",
          email: "rae@example.com",
        },
      },
    ],
    nextCursor: null,
  },
};

describe("DocumentDashboard", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
  });

  it("renders the requested table-style homepage without dashboard stats", () => {
    render(
      <DocumentDashboard initialData={dashboardData} />,
    );

    expect(
      screen.getByRole("button", { name: "Add document" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Import file" }),
    ).toBeVisible();
    expect(screen.getAllByRole("table")).toHaveLength(2);
    expect(screen.getByText("Document library")).toBeVisible();
    expect(screen.getByText("Owned by me")).toBeVisible();
    expect(screen.getByText("Shared with me")).toBeVisible();
    expect(screen.getByText("Rae Thomas")).toBeVisible();
    expect(screen.queryByText("Default save mode")).not.toBeInTheDocument();
    expect(screen.queryByText("Pick up where you left off.")).not.toBeInTheDocument();
    expect(screen.queryByText("Maya Patel")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sign out" })).not.toBeInTheDocument();
  });

  it("keeps create and import actions visible in the empty state", () => {
    render(
      <DocumentDashboard
        initialData={{
          owned: { items: [], nextCursor: null },
          shared: { items: [], nextCursor: null },
        }}
      />,
    );

    expect(screen.getByText("No owned documents yet")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Create untitled document" }),
    ).toBeVisible();
    expect(
      screen.getAllByRole("button", { name: "Import file" }).length,
    ).toBeGreaterThan(0);
  });

  it("groups document actions in a three-dot menu", async () => {
    const user = userEvent.setup();

    render(<DocumentDashboard initialData={dashboardData} />);

    await user.click(
      screen.getByRole("button", { name: "Open actions for Release brief" }),
    );

    expect(screen.getByRole("menuitem", { name: "Open" })).toBeVisible();
    expect(screen.getByRole("menuitem", { name: "Rename" })).toBeVisible();
    expect(screen.getByRole("menuitem", { name: "Share" })).toBeVisible();
    expect(screen.getByRole("menuitem", { name: "Delete" })).toBeVisible();
  });
});
