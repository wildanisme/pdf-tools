import { expect, test } from "@playwright/test";
import { createImageFiles } from "./fixtures";

test("image to PDF keeps a scrollable list and supports drag reorder plus delete", async ({ page }) => {
  const files = createImageFiles(8);

  await page.goto("/image-to-pdf");
  await expect(page.getByRole("heading", { name: "Image to PDF" })).toBeVisible();
  await page.waitForLoadState("networkidle");
  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Pilih gambar", exact: true }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(files);

  const items = page.locator('article[role="listitem"]');
  await expect(items).toHaveCount(8);

  const listMetrics = await page.locator('div[role="list"]').evaluate((node) => ({
    clientHeight: node.clientHeight,
    scrollHeight: node.scrollHeight,
    overflowY: getComputedStyle(node).overflowY,
  }));

  expect(listMetrics.overflowY).toBe("auto");
  expect(listMetrics.scrollHeight).toBeGreaterThan(listMetrics.clientHeight);

  await expect(items.nth(0).locator("strong")).toHaveText("sample-1.png");
  await items.nth(0).dragTo(items.nth(2));

  await expect(items.nth(0).locator("strong")).toHaveText("sample-2.png");
  await expect(items.nth(1).locator("strong")).toHaveText("sample-3.png");
  await expect(items.nth(2).locator("strong")).toHaveText("sample-1.png");

  await page.getByLabel("Remove sample-1.png").click();

  await expect(items).toHaveCount(7);
  await expect(page.locator('article[role="listitem"] strong')).not.toContainText(["sample-1.png"]);
});
