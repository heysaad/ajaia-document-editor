import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DocumentCard } from "@/features/documents/components/document-card";
import type { DocumentSummary } from "@/features/documents/models";

const document: DocumentSummary = {
  id: "5c301301-2b15-47ec-ae55-b0f3ac3bcf51",
  title: "Release brief",
  excerpt: "A concise preview",
  version: 3,
  updatedAt: "2026-07-27T10:00:00.000Z",
};

describe("DocumentCard", () => {
  it("exposes controlled rename and delete actions", async () => {
    const user = userEvent.setup();
    const onRenameStart = vi.fn();
    const onRenameValueChange = vi.fn();
    const onRenameSave = vi.fn();
    const onDeleteConfirm = vi.fn();
    const baseProps = {
      document,
      renameValue: document.title,
      onRenameValueChange,
      onRenameStart,
      onRenameCancel: vi.fn(),
      onRenameSave,
      onDeleteRequest: vi.fn(),
      onDeleteCancel: vi.fn(),
      onDeleteConfirm,
    };
    const view = render(
      <DocumentCard
        {...baseProps}
        isRenaming={false}
        pendingDeleteId={null}
      />,
    );

    expect(
      screen.getByRole("link", { name: "Release brief" }),
    ).toHaveAttribute("href", `/documents/${document.id}`);
    await user.click(screen.getByRole("button", { name: "Rename" }));
    expect(onRenameStart).toHaveBeenCalledWith(document);

    view.rerender(
      <DocumentCard
        {...baseProps}
        isRenaming
        pendingDeleteId={null}
      />,
    );
    await user.clear(screen.getByRole("textbox", { name: "Document title" }));
    await user.type(
      screen.getByRole("textbox", { name: "Document title" }),
      "Updated title",
    );
    expect(onRenameValueChange).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Save title" }));
    expect(onRenameSave).toHaveBeenCalledWith(document.id);

    view.rerender(
      <DocumentCard
        {...baseProps}
        isRenaming={false}
        pendingDeleteId={document.id}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Confirm delete" }));
    expect(onDeleteConfirm).toHaveBeenCalledWith(document.id);
  });
});
