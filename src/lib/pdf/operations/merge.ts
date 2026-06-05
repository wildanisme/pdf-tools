import { PDFDocument } from "pdf-lib";
import type { PdfDocumentState, PdfProcessingResult } from "@/lib/pdf/types";

export async function mergePdfDocuments(
  documents: Pick<PdfDocumentState, "bytes" | "name">[],
): Promise<PdfProcessingResult> {
  if (documents.length < 2) {
    throw new Error("Pilih minimal dua PDF untuk digabungkan.");
  }

  const output = await PDFDocument.create();

  for (const document of documents) {
    const source = await PDFDocument.load(document.bytes);
    const copiedPages = await output.copyPages(source, source.getPageIndices());

    for (const page of copiedPages) {
      output.addPage(page);
    }
  }

  const bytes = await output.save();

  return {
    fileName: "merged.pdf",
    bytes,
    pageCount: output.getPageCount(),
  };
}
