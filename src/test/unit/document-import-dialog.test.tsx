import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DocumentImportDialog } from "@/features/document-import/components/document-import-dialog";
import type { DocumentDetail } from "@/features/documents/models";

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

const importedDocument: DocumentDetail = {
  id: "5c301301-2b15-47ec-ae55-b0f3ac3bcf51",
  title: "Imported notes",
  excerpt: "Imported notes",
  version: 1,
  updatedAt: "2026-07-27T10:00:00.000Z",
  createdAt: "2026-07-27T10:00:00.000Z",
  contentJson: { type: "doc", content: [{ type: "paragraph" }] },
  owner: {
    id: "771f2b30-3b0c-40d8-a96f-6c2ded9e70a1",
    name: "Maya Patel",
    email: "maya@example.com",
  },
  accessRole: "OWNER",
};

describe("DocumentImportDialog", () => {
  beforeEach(() => {
    mocks.fetchJson.mockReset();
  });

  it("shows client-side validation errors for unsupported files", async () => {
    const user = userEvent.setup({ applyAccept: false });
    render(
      <DocumentImportDialog
        open
        onOpenChange={vi.fn()}
        onImported={vi.fn()}
      />,
    );

    await user.upload(
      screen.getByLabelText("Choose one file to import"),
      new File(["binary"], "diagram.png", { type: "image/png" }),
    );

    expect(
      await screen.findByText("Choose a .txt or .md file."),
    ).toBeVisible();
    expect(mocks.fetchJson).not.toHaveBeenCalled();
  });

  it("submits the selected file as multipart form data and closes on success", async () => {
    const user = userEvent.setup();
    const onImported = vi.fn();
    const onOpenChange = vi.fn();
    mocks.fetchJson.mockResolvedValue(importedDocument);

    render(
      <DocumentImportDialog
        open
        onOpenChange={onOpenChange}
        onImported={onImported}
      />,
    );

    await user.upload(
      screen.getByLabelText("Choose one file to import"),
      new File(["# Imported"], "import.md", { type: "text/markdown" }),
    );
    await user.click(screen.getByRole("button", { name: "Import file" }));

    await waitFor(() => {
      expect(mocks.fetchJson).toHaveBeenCalledTimes(1);
      expect(onImported).toHaveBeenCalledWith(importedDocument);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    const [, requestInit] = mocks.fetchJson.mock.calls[0] as [
      string,
      RequestInit,
    ];
    const formData = requestInit.body as FormData;

    expect(mocks.fetchJson).toHaveBeenCalledWith(
      "/api/documents/import",
      expect.objectContaining({
        method: "POST",
        body: expect.any(FormData),
      }),
    );
    expect(formData.get("file")).toBeInstanceOf(File);
    expect((formData.get("file") as File).name).toBe("import.md");
  });
});
