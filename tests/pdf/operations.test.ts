import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { extractPdfPages } from "@/lib/pdf/operations/extract";
import { mergePdfDocuments } from "@/lib/pdf/operations/merge";

async function createPdf(pageCount: number): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();

  for (let index = 0; index < pageCount; index += 1) {
    pdf.addPage([300, 400]);
  }

  return pdf.save();
}

describe("PDF operations", () => {
  it("merges multiple PDFs in input order", async () => {
    const first = await createPdf(2);
    const second = await createPdf(3);

    const result = await mergePdfDocuments([
      { name: "first.pdf", bytes: first },
      { name: "second.pdf", bytes: second },
    ]);

    const merged = await PDFDocument.load(result.bytes);

    expect(result.pageCount).toBe(5);
    expect(merged.getPageCount()).toBe(5);
  });

  it("extracts selected pages into a new PDF", async () => {
    const source = await createPdf(5);
    const result = await extractPdfPages(source, [0, 2, 4]);
    const extracted = await PDFDocument.load(result.bytes);

    expect(result.pageCount).toBe(3);
    expect(extracted.getPageCount()).toBe(3);
  });
});
