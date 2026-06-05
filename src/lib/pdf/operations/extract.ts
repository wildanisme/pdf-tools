import { PDFDocument } from "pdf-lib";
import type { PdfProcessingResult } from "@/lib/pdf/types";

export async function extractPdfPages(
  bytes: Uint8Array,
  pageIndexes: number[],
): Promise<PdfProcessingResult> {
  if (pageIndexes.length === 0) {
    throw new Error("Pilih minimal satu halaman untuk diekstrak.");
  }

  const source = await PDFDocument.load(bytes);
  const totalPages = source.getPageCount();

  for (const pageIndex of pageIndexes) {
    if (!Number.isInteger(pageIndex) || pageIndex < 0 || pageIndex >= totalPages) {
      throw new Error(`Index halaman ${pageIndex} tidak valid.`);
    }
  }

  const output = await PDFDocument.create();
  const copiedPages = await output.copyPages(source, pageIndexes);

  for (const page of copiedPages) {
    output.addPage(page);
  }

  const outputBytes = await output.save();

  return {
    fileName: "extracted-pages.pdf",
    bytes: outputBytes,
    pageCount: output.getPageCount(),
  };
}
