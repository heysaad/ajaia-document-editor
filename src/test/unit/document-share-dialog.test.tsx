import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DocumentShareDialog } from "@/features/document-sharing/components/document-share-dialog";
import type {
  DocumentShareSummary,
  ShareTargetRecord,
} from "@/features/document-sharing/models";

const mocks = vi.hoisted(() => ({
  fetchJson: vi.fn(),
}));

vi.mock("@/lib/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-client")>(
    "@/lib/api-client",
  );

  return {
    ...actual,
    fetchJson: mocks.fetchJson,
  };
});

const documentId = "f6bf2b8b-6049-4551-b733-03484bf67a19";
const jordan: ShareTargetRecord = {
  id: "4de589e7-7db9-412c-95bf-fbc9ad717213",
  name: "Jordan Lee",
  email: "jordan@example.com",
};
const avery: ShareTargetRecord = {
  id: "077386c8-061a-454d-aa63-fe76f46adc79",
  name: "Avery Carter",
  email: "avery@example.com",
};

function shareFor(user: ShareTargetRecord): DocumentShareSummary {
  return {
    user,
    role: "EDITOR",
    createdAt: "2026-07-28T08:00:00.000Z",
  };
}

function renderDialog() {
  return render(
    <DocumentShareDialog
      open
      onOpenChange={vi.fn()}
      documentId={documentId}
      documentTitle="Project notes"
    />,
  );
}

describe("DocumentShareDialog", () => {
  beforeEach(() => {
    mocks.fetchJson.mockReset();
  });

  it("opens suggestions on focus and grants the selected user immediately", async () => {
    const user = userEvent.setup();
    mocks.fetchJson.mockImplementation(
      async (url: string, init?: RequestInit) => {
        if (url.endsWith("/shares") && !init?.method) {
          return { items: [] };
        }
        if (url.includes("/eligible-users")) {
          return { items: [jordan] };
        }
        if (url.endsWith("/shares") && init?.method === "POST") {
          return { share: shareFor(jordan), created: true };
        }
        throw new Error(`Unexpected request: ${url}`);
      },
    );

    renderDialog();

    const option = await screen.findByRole("option", {
      name: "Grant access to Jordan Lee jordan@example.com",
    });
    await user.click(option);

    await waitFor(() => {
      expect(mocks.fetchJson).toHaveBeenCalledWith(
        `/api/documents/${documentId}/shares`,
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ userId: jordan.id }),
        }),
      );
    });
    expect(
      await screen.findByText("Editor access granted to Jordan Lee."),
    ).toBeVisible();
    expect(screen.getByText("Jordan Lee")).toBeVisible();
    expect(screen.getByLabelText("Add people")).toHaveValue("");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Add people")).toHaveFocus();
  });

  it("debounces server searches and ignores a stale response", async () => {
    const user = userEvent.setup();
    let resolveInitialSearch:
      | ((value: { items: ShareTargetRecord[] }) => void)
      | undefined;
    const initialSearch = new Promise<{ items: ShareTargetRecord[] }>(
      (resolve) => {
        resolveInitialSearch = resolve;
      },
    );

    mocks.fetchJson.mockImplementation(
      async (url: string, init?: RequestInit) => {
        if (url.endsWith("/shares") && !init?.method) {
          return { items: [] };
        }
        if (url.endsWith("eligible-users?q=")) {
          return initialSearch;
        }
        if (url.endsWith("eligible-users?q=avery")) {
          return { items: [avery] };
        }
        throw new Error(`Unexpected request: ${url}`);
      },
    );

    renderDialog();
    await waitFor(
      () => {
        expect(mocks.fetchJson).toHaveBeenCalledWith(
          `/api/documents/${documentId}/shares/eligible-users?q=`,
          expect.objectContaining({ signal: expect.any(AbortSignal) }),
        );
      },
      { timeout: 1_000 },
    );

    await user.type(screen.getByLabelText("Add people"), "avery");

    expect(
      await screen.findByRole("option", {
        name: "Grant access to Avery Carter avery@example.com",
      }),
    ).toBeVisible();
    expect(
      mocks.fetchJson.mock.calls.filter(([url]) =>
        String(url).includes("/eligible-users"),
      ),
    ).toHaveLength(2);

    resolveInitialSearch?.({ items: [jordan] });
    await new Promise((resolve) => window.setTimeout(resolve, 20));

    expect(screen.getByText("Avery Carter")).toBeVisible();
    expect(screen.queryByText("Jordan Lee")).not.toBeInTheDocument();
  });

  it("supports keyboard selection and displays an empty search state", async () => {
    const user = userEvent.setup();
    mocks.fetchJson.mockImplementation(
      async (url: string, init?: RequestInit) => {
        if (url.endsWith("/shares") && !init?.method) {
          return { items: [] };
        }
        if (url.endsWith("eligible-users?q=")) {
          return { items: [jordan] };
        }
        if (url.endsWith("eligible-users?q=nobody")) {
          return { items: [] };
        }
        if (url.endsWith("/shares") && init?.method === "POST") {
          return { share: shareFor(jordan), created: true };
        }
        throw new Error(`Unexpected request: ${url}`);
      },
    );

    renderDialog();
    const input = screen.getByLabelText("Add people");
    await screen.findByRole("option", {
      name: "Grant access to Jordan Lee jordan@example.com",
    });

    await user.keyboard("{ArrowDown}{Enter}");
    expect(
      await screen.findByText("Editor access granted to Jordan Lee."),
    ).toBeVisible();

    await user.clear(input);
    await user.type(input, "nobody");
    expect(await screen.findByText("No users found.")).toBeVisible();
  });

  it("keeps search errors inline and removes access after confirmation", async () => {
    const user = userEvent.setup();
    let searchAttempts = 0;
    mocks.fetchJson.mockImplementation(
      async (url: string, init?: RequestInit) => {
        if (url.endsWith("/shares") && !init?.method) {
          return { items: [shareFor(jordan)] };
        }
        if (url.includes("/eligible-users")) {
          searchAttempts += 1;
          if (searchAttempts === 1) {
            throw new Error("Search is temporarily unavailable.");
          }
          return { items: [] };
        }
        if (url.endsWith(`/shares/${jordan.id}`) && init?.method === "DELETE") {
          return undefined;
        }
        throw new Error(`Unexpected request: ${url}`);
      },
    );

    renderDialog();

    expect(
      await screen.findByText("Search is temporarily unavailable."),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("No users found.")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(
      screen.getByText(
        "Jordan Lee will no longer be able to open or edit this document.",
      ),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Remove access" }));

    await waitFor(() => {
      expect(mocks.fetchJson).toHaveBeenCalledWith(
        `/api/documents/${documentId}/shares/${jordan.id}`,
        { method: "DELETE" },
      );
    });
    expect(await screen.findByText("Access removed for Jordan Lee.")).toBeVisible();
    expect(screen.getByText("No shared editors yet.")).toBeVisible();
  });
});
