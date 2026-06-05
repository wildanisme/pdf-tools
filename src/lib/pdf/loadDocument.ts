import { PDFDocument } from "pdf-lib";
import type { PdfDocumentState } from "@/lib/pdf/types";

export async function loadPdfDocument(file: File): Promise<PdfDocumentState> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const pdf = await PDFDocument.load(bytes);

  return {
    id: crypto.randomUUID(),
    name: file.name,
    size: file.size,
    bytes,
    pageCount: pdf.getPageCount(),
    createdAt: Date.now(),
  };
}

export async function getPdfPageCount(bytes: Uint8Array): Promise<number> {
  const pdf = await PDFDocument.load(bytes);
  return pdf.getPageCount();
}
