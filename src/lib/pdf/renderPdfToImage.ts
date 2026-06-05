import { toArrayBuffer } from "@/lib/bytes";
import type { PdfProcessingResult } from "@/lib/pdf/types";

export async function renderPdfPageToImage(
  bytes: Uint8Array,
  options: { pageIndex: number; format: "image/png" | "image/jpeg"; scale: number },
): Promise<PdfProcessingResult> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).toString();

  const loadingTask = pdfjs.getDocument({ data: toArrayBuffer(bytes) });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(options.pageIndex + 1);
  const viewport = page.getViewport({ scale: options.scale });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Browser tidak mendukung canvas 2D.");
  }

  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);

  await page.render({
    canvas,
    canvasContext: context,
    viewport,
  }).promise;

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, options.format, 0.92));

  if (!blob) {
    throw new Error("Gagal membuat gambar dari halaman PDF.");
  }

  const imageBytes = new Uint8Array(await blob.arrayBuffer());
  await pdf.cleanup();
  await loadingTask.destroy();

  return {
    fileName: `page-${options.pageIndex + 1}.${options.format === "image/png" ? "png" : "jpg"}`,
    bytes: imageBytes,
    pageCount: 1,
    mimeType: options.format,
  };
}
