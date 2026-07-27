import { expect, test } from "@playwright/test";

test("creates, formats, reopens, renames, and deletes a document", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL("/login");
  await page.getByLabel("Email").fill("maya@example.com");
  await page
    .getByLabel("Password")
    .fill(process.env.DEMO_USER_PASSWORD ?? "demo-password-1234");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/", { timeout: 30_000 });

  const createButton = page.getByRole("button", { name: "Add document" });
  await expect(createButton).toBeEnabled();
  await createButton.click();
  await expect(page).toHaveURL(/\/documents\/[0-9a-f-]+$/, {
    timeout: 30_000,
  });
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
  await card
    .getByRole("button", { name: "Open actions for Lifecycle verification" })
    .click();
  await page.getByRole("menuitem", { name: "Rename" }).click();
  await card
    .getByRole("textbox", { name: "Document title" })
    .fill("Renamed lifecycle document");
  await card.getByRole("button", { name: "Save title" }).click();
  await expect(
    card.getByRole("link", { name: "Renamed lifecycle document" }),
  ).toBeVisible();

  await card
    .getByRole("button", { name: "Open actions for Renamed lifecycle document" })
    .click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await page.getByRole("button", { name: "Confirm delete" }).click();
  await expect(card).toHaveCount(0);
});

test("rejects invalid credentials without exposing account details", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("unknown@example.com");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(
    page.getByText("The email or password is incorrect."),
  ).toBeVisible();
  await expect(page).toHaveURL("/login");
});
