import { expect, test } from "@playwright/test";

test("creates, formats, reopens, renames, and deletes a document", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Maya Patel maya@example.com" })
    .click();
  const createButton = page
    .getByRole("button", { name: "Create untitled document" })
    .first();
  await expect(createButton).toBeEnabled();
  await createButton.click();
  await expect(page).toHaveURL(/\/documents\/[0-9a-f-]+$/);
  const documentId = page.url().split("/").at(-1)!;

  await page.getByRole("textbox", { name: "Document title" }).fill(
    "Lifecycle verification",
  );
  const editor = page.getByLabel("Document content");
  await editor.fill("Formatting survives refresh.");
  await editor.press("Control+a");
  await page.getByRole("button", { name: "Bold (Ctrl+B)" }).click();
  await expect(page.getByText(/Saved at/)).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Document title" }),
  ).toHaveValue("Lifecycle verification");
  await expect(page.getByLabel("Document content").locator("strong")).toHaveText(
    "Formatting survives refresh.",
  );

  await page.getByRole("button", { name: "Back to documents" }).click();
  await expect(page).toHaveURL("/");

  const card = page.locator(`[data-document-id="${documentId}"]`);
  await card.getByRole("button", { name: "Rename" }).click();
  await card
    .getByRole("textbox", { name: "Document title" })
    .fill("Renamed lifecycle document");
  await card.getByRole("button", { name: "Save title" }).click();
  await expect(
    card.getByRole("link", { name: "Renamed lifecycle document" }),
  ).toBeVisible();

  await card.getByRole("button", { name: "Delete" }).click();
  await card.getByRole("button", { name: "Confirm delete" }).click();
  await expect(card).toHaveCount(0);
});
