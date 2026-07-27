import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DocumentEditorHeader } from "@/features/document-editing/components/document-editor-header";

describe("DocumentEditorHeader", () => {
  it("shows shared-editor context with a read-only title field", () => {
    render(
      <DocumentEditorHeader
        title="Shared outline"
        onTitleChange={vi.fn()}
        saveState="saved"
        lastSavedAt="2026-07-27T10:01:00.000Z"
        version={4}
        ownerLabel="Owner: Rae Thomas"
        accessRoleLabel="Shared editor"
        isTitleEditable={false}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByText("Owner: Rae Thomas")).toBeVisible();
    expect(screen.getByText("Shared editor")).toBeVisible();
    expect(screen.getByText("Shared outline")).toBeVisible();
    expect(
      screen.queryByRole("textbox", { name: "Document title" }),
    ).not.toBeInTheDocument();
  });

  it("shows owner actions when editing is allowed", () => {
    render(
      <DocumentEditorHeader
        title="Owner draft"
        onTitleChange={vi.fn()}
        saveState="dirty"
        lastSavedAt={null}
        version={6}
        ownerLabel="Owner: Maya Patel"
        accessRoleLabel="Owner access"
        actions={<button type="button">Manage access</button>}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Manage access" })).toBeVisible();
    expect(
      screen.getByRole("textbox", { name: "Document title" }),
    ).toHaveValue("Owner draft");
  });
});
