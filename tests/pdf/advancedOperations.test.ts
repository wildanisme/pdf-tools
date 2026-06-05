import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import {
  addPageNumbers,
  addWatermark,
  compressPdf,
  cropPdfPages,
  deletePdfPages,
  duplicatePdfPages,
  editPdfMetadata,
  imagesToPdf,
  insertBlankPages,
  nUpPdfPages,
  reorderPdfPages,
  resizePdfPages,
  rotatePdfPages,
  rotatePdfPagesByDegrees,
  sortPdfPages,
} from "@/lib/pdf/operations/advanced";

const ONE_BY_ONE_PNG = Uint8Array.from([
  137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 4, 0, 0, 0,
  181, 28, 12, 2, 0, 0, 0, 11, 73, 68, 65, 84, 120, 156, 99, 250, 207, 0, 0, 2, 7, 1, 2, 154, 28,
  49, 113, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130,
]);

async function createPdf(pageCount: number): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();

  for (let index = 0; index < pageCount; index += 1) {
    const page = pdf.addPage([300 + index, 400 + index]);
    page.drawText(`Page ${index + 1}`, { x: 20, y: 20, size: 12 });
  }

  return pdf.save();
}

describe("advanced PDF operations", () => {
  it("deletes selected pages while preserving at least one page", async () => {
    const result = await deletePdfPages(await createPdf(4), [1, 3]);
    const pdf = await PDFDocument.load(result.bytes);

    expect(pdf.getPageCount()).toBe(2);
  });

  it("reorders pages using a complete page order", async () => {
    const result = await reorderPdfPages(await createPdf(3), [2, 0, 1]);
    const pdf = await PDFDocument.load(result.bytes);

    expect(pdf.getPageCount()).toBe(3);
  });

  it("duplicates selected pages", async () => {
    const result = await duplicatePdfPages(await createPdf(2), [0, 1]);
    const pdf = await PDFDocument.load(result.bytes);

    expect(pdf.getPageCount()).toBe(4);
  });

  it("sorts pages descending", async () => {
    const result = await sortPdfPages(await createPdf(3), "desc");
    const pdf = await PDFDocument.load(result.bytes);

    expect(pdf.getPageCount()).toBe(3);
  });

  it("rotates selected pages", async () => {
    const result = await rotatePdfPages(await createPdf(2), [0], 90);
    const pdf = await PDFDocument.load(result.bytes);

    expect(pdf.getPage(0).getRotation().angle).toBe(90);
    expect(pdf.getPage(1).getRotation().angle).toBe(0);
  });

  it("rotates pages with independent per-page degrees", async () => {
    const result = await rotatePdfPagesByDegrees(await createPdf(3), [
      { pageIndex: 0, rotation: 90 },
      { pageIndex: 1, rotation: 180 },
      { pageIndex: 2, rotation: 0 },
    ]);
    const pdf = await PDFDocument.load(result.bytes);

    expect(pdf.getPage(0).getRotation().angle).toBe(90);
    expect(pdf.getPage(1).getRotation().angle).toBe(180);
    expect(pdf.getPage(2).getRotation().angle).toBe(0);
  });

  it("adds watermark and page numbers without changing page count", async () => {
    const watermarked = await addWatermark(await createPdf(2), {
      mode: "text",
      text: "PRIVATE",
      opacity: 0.25,
      fontSize: 36,
      rotation: -35,
      color: "#0d7a56",
      placement: "center",
      repeat: true,
    });
    const numbered = await addPageNumbers(watermarked.bytes, { format: "page", startAt: 1, totalPages: 2, position: "bottom-center" });
    const pdf = await PDFDocument.load(numbered.bytes);

    expect(pdf.getPageCount()).toBe(2);
  });

  it("edits metadata", async () => {
    const result = await editPdfMetadata(await createPdf(1), {
      title: "Local PDF",
      author: "Privacy PDF Tools",
      keywords: "local,privacy",
    });
    const pdf = await PDFDocument.load(result.bytes, { updateMetadata: false });

    expect(pdf.getTitle()).toBe("Local PDF");
    expect(pdf.getAuthor()).toBe("Privacy PDF Tools");
    expect(pdf.getCreator()).toBe("Privacy PDF Tools");
    expect(pdf.getProducer()).toBe("Privacy PDF Tools");
    expect(pdf.getKeywords()).toContain("privacy");
  });

  it("creates a PDF from images", async () => {
    const result = await imagesToPdf([{ bytes: ONE_BY_ONE_PNG, type: "image/png" }], {
      pageSize: "a4",
      margin: 24,
    });
    const pdf = await PDFDocument.load(result.bytes);

    expect(pdf.getPageCount()).toBe(1);
  });

  it("crops and resizes pages", async () => {
    const cropped = await cropPdfPages(await createPdf(1), 10);
    const resized = await resizePdfPages(cropped.bytes, "letter");
    const pdf = await PDFDocument.load(resized.bytes);

    expect(pdf.getPage(0).getWidth()).toBe(612);
    expect(pdf.getPage(0).getHeight()).toBe(792);
  });

  it("inserts blank pages and creates n-up output", async () => {
    const withBlank = await insertBlankPages(await createPdf(2), { afterPageIndex: 0, count: 2 });
    const nUp = await nUpPdfPages(withBlank.bytes, 2);
    const pdf = await PDFDocument.load(nUp.bytes);

    expect(withBlank.pageCount).toBe(4);
    expect(pdf.getPageCount()).toBe(2);
  });

  it("compresses by resaving with object streams", async () => {
    const source = await createPdf(1);
    const result = await compressPdf(source);

    expect(result.pageCount).toBe(1);
    expect(result.sizeBefore).toBe(source.byteLength);
    expect(result.sizeAfter).toBe(result.bytes.byteLength);
  });
});
