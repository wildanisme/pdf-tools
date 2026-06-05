import { expect, test } from "@playwright/test";
import { createPdfFile } from "./fixtures";

test("PDF to Image previews pages in a three-column grid and exports selected pages", async ({ page }) => {
  const pdfFile = await createPdfFile(5);

  await page.goto("/pdf-to-image");
  await expect(page.getByRole("heading", { name: "PDF to Image" })).toBeVisible();
  await page.waitForLoadState("networkidle");
  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Pilih PDF", exact: true }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(pdfFile);

  const pageCards = page.locator('[role="list"][aria-label="PDF pages"] label');
  await expect(pageCards).toHaveCount(5);

  await expect
    .poll(async () => {
      return pageCards.evaluateAll((cards) => {
        return cards.filter((card) => {
          const preview = card.querySelector('span[aria-hidden="true"]');
          return preview && getComputedStyle(preview).backgroundImage !== "none";
        }).length;
      });
    })
    .toBe(5);

  const layout = await pageCards.evaluateAll((cards) => {
    const firstRowTop = cards[0]?.getBoundingClientRect().top ?? 0;
    return {
      firstRowCount: cards.filter((card) => Math.abs(card.getBoundingClientRect().top - firstRowTop) < 2).length,
    };
  });

  expect(layout.firstRowCount).toBe(3);

  const checkboxes = page.locator('[role="list"][aria-label="PDF pages"] input[type="checkbox"]');
  await expect(checkboxes).toHaveCount(5);

  const checkedCount = await checkboxes.evaluateAll((inputs) => inputs.filter((input) => (input as HTMLInputElement).checked).length);
  expect(checkedCount).toBe(5);

  await page.getByRole("button", { name: "Proses" }).click();

  await expect(page.getByText("pdf-pages-images.zip siap")).toBeVisible();
  await expect(page.getByText("5 gambar")).toBeVisible();
});
