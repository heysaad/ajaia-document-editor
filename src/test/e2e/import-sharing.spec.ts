import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page
    .getByLabel("Password")
    .fill(process.env.DEMO_USER_PASSWORD ?? "demo-password-1234");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/", { timeout: 30_000 });
}

async function signOut(page: Page, email: string) {
  await page.getByRole("button", { name: new RegExp(email, "i") }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL("/login");
}

test("imports Markdown and grants a registered user shared editor access", async ({
  page,
}) => {
  const title = `Shared import ${Date.now()}`;

  await signIn(page, "maya@example.com");
  await page.getByRole("button", { name: "Import file" }).click();
  await page.getByLabel("Choose one file to import").setInputFiles({
    name: `${title}.md`,
    mimeType: "text/markdown",
    buffer: Buffer.from("# Imported review\n\nA **shared** draft."),
  });
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Import file" })
    .click();

  await expect(page).toHaveURL(/\/documents\/[0-9a-f-]+$/, {
    timeout: 30_000,
  });
  await expect(page.getByRole("textbox", { name: "Document title" })).toHaveValue(
    title,
  );
  await expect(page.getByLabel("Document content")).toContainText(
    "Imported review",
  );

  await page.getByRole("button", { name: "Back to documents" }).click();
  const ownedRow = page.locator("[data-document-id]", {
    has: page.getByRole("link", { name: title }),
  });
  await ownedRow
    .getByRole("button", { name: `Open actions for ${title}` })
    .click();
  await page.getByRole("menuitem", { name: "Share" }).click();

  const shareDialog = page.getByRole("dialog", {
    name: `Manage access for ${title}`,
  });
  await shareDialog.getByLabel("Add people").fill("jordan@example.com");
  await shareDialog
    .getByRole("option", {
      name: "Grant access to Jordan Lee jordan@example.com",
    })
    .click();
  await expect(
    shareDialog.getByText("Editor access granted to Jordan Lee."),
  ).toBeVisible();
  await shareDialog
    .getByRole("button", { name: "Close", exact: true })
    .click();

  await signOut(page, "maya@example.com");
  await signIn(page, "jordan@example.com");

  await expect(page.getByRole("heading", { name: "Shared with me" })).toBeVisible();
  await page.getByRole("link", { name: title }).click();
  await expect(page.getByText("Owner: Maya Patel")).toBeVisible();
  await expect(page.getByText("Shared editor")).toBeVisible();
  await expect(page.getByText("Document title")).toBeVisible();
  await expect(page.getByText(title, { exact: true })).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Document title" }),
  ).toHaveCount(0);
  await page
    .getByLabel("Document content")
    .fill("Edited successfully by the shared user.");
  await expect(page.getByText(/Saved at/)).toBeVisible();

  await signOut(page, "jordan@example.com");
  await signIn(page, "maya@example.com");

  const cleanupRow = page.locator("[data-document-id]", {
    has: page.getByRole("link", { name: title }),
  });
  await cleanupRow
    .getByRole("button", { name: `Open actions for ${title}` })
    .click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await page.getByRole("button", { name: "Confirm delete" }).click();
  await expect(cleanupRow).toHaveCount(0);
});
