import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DocumentDashboard } from "@/features/documents/components/document-dashboard";
import type { DocumentDashboardData } from "@/features/documents/models";

const { fetchJsonMock } = vi.hoisted(() => ({
  fetchJsonMock: vi.fn(),
}));

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

vi.mock("@/lib/api-client", () => ({
  fetchJson: fetchJsonMock,
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
    pagination: {
      page: 1,
      pageSize: 12,
      totalItems: 2,
      totalPages: 2,
      hasNextPage: true,
      hasPreviousPage: false,
    },
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
    pagination: {
      page: 1,
      pageSize: 12,
      totalItems: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  },
};

const nextOwnedPageData: DocumentDashboardData = {
  owned: {
    items: [
      {
        id: "5c301301-2b15-47ec-ae55-b0f3ac3bcf52",
        title: "Release brief v2",
        excerpt: "The next page of owned documents",
        version: 4,
        updatedAt: "2026-07-27T12:00:00.000Z",
        accessRole: "OWNER",
        owner: {
          id: "u1",
          name: "Maya Patel",
          email: "maya@example.com",
        },
      },
    ],
    pagination: {
      page: 2,
      pageSize: 12,
      totalItems: 2,
      totalPages: 2,
      hasNextPage: false,
      hasPreviousPage: true,
    },
  },
  shared: dashboardData.shared,
};

describe("DocumentDashboard", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    fetchJsonMock.mockReset();
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
    expect(screen.getByText("Page 1 of 2 · 2 documents")).toBeVisible();
    expect(screen.getByText("Page 1 of 1 · 1 documents")).toBeVisible();
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
          owned: {
            items: [],
            pagination: {
              page: 1,
              pageSize: 12,
              totalItems: 0,
              totalPages: 1,
              hasNextPage: false,
              hasPreviousPage: false,
            },
          },
          shared: {
            items: [],
            pagination: {
              page: 1,
              pageSize: 12,
              totalItems: 0,
              totalPages: 1,
              hasNextPage: false,
              hasPreviousPage: false,
            },
          },
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

  it("loads the next owned page through the paginated API", async () => {
    const user = userEvent.setup();
    fetchJsonMock.mockResolvedValueOnce(nextOwnedPageData);

    render(<DocumentDashboard initialData={dashboardData} />);

    await user.click(screen.getAllByRole("button", { name: "Next" })[0]);

    expect(fetchJsonMock).toHaveBeenCalledWith(
      "/api/documents?ownedPage=2&sharedPage=1&pageSize=12",
    );
    expect(await screen.findByText("Release brief v2")).toBeVisible();
    expect(screen.getByText("Page 2 of 2 · 2 documents")).toBeVisible();
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
