import { toArrayBuffer } from "@/lib/bytes";
import type { PdfProcessingResult } from "@/lib/pdf/types";
import { createStoreZip } from "@/lib/zip/storeZip";
import type { PDFPageProxy } from "pdfjs-dist";

export async function renderPdfPageToImage(
  bytes: Uint8Array,
  options: { pageIndex: number; format: "image/png" | "image/jpeg"; scale: number },
): Promise<PdfProcessingResult> {
  return renderPdfPagesToImages(bytes, { ...options, pageIndexes: [options.pageIndex] });
}

export async function renderPdfPagesToImages(
  bytes: Uint8Array,
  options: { pageIndexes: number[]; format: "image/png" | "image/jpeg"; scale: number },
): Promise<PdfProcessingResult> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).toString();

  const loadingTask = pdfjs.getDocument({ data: toArrayBuffer(bytes) });
  const pdf = await loadingTask.promise;

  try {
    const normalizedPageIndexes = [...new Set(options.pageIndexes)]
      .filter((pageIndex) => pageIndex >= 0 && pageIndex < pdf.numPages)
      .sort((first, second) => first - second);

    if (normalizedPageIndexes.length === 0) {
      throw new Error("Pilih minimal satu halaman untuk diexport.");
    }

    const images = [];

    for (const pageIndex of normalizedPageIndexes) {
      const page = await pdf.getPage(pageIndex + 1);
      const blob = await renderPdfPageBlob(page, options.scale, options.format);
      images.push({
        name: `page-${pageIndex + 1}.${options.format === "image/png" ? "png" : "jpg"}`,
        bytes: new Uint8Array(await blob.arrayBuffer()),
      });
      page.cleanup();
    }

    if (images.length === 1) {
      return {
        fileName: images[0].name,
        bytes: images[0].bytes,
        pageCount: 1,
        mimeType: options.format,
      };
    }

    const zipBytes = createStoreZip(images);

    return {
      fileName: "pdf-pages-images.zip",
      bytes: zipBytes,
      pageCount: images.length,
      mimeType: "application/zip",
    };
  } finally {
    await pdf.cleanup();
    await loadingTask.destroy();
  }
}

export async function renderPdfPagePreviewUrls(
  bytes: Uint8Array,
  options: { pageCount: number; scale: number },
): Promise<string[]> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).toString();

  const loadingTask = pdfjs.getDocument({ data: toArrayBuffer(bytes) });
  const pdf = await loadingTask.promise;

  try {
    const urls: string[] = [];
    const pageCount = Math.min(options.pageCount, pdf.numPages);

    for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
      const page = await pdf.getPage(pageIndex + 1);
      const blob = await renderPdfPageBlob(page, options.scale, "image/png");
      urls.push(URL.createObjectURL(blob));
      page.cleanup();
    }

    return urls;
  } finally {
    await pdf.cleanup();
    await loadingTask.destroy();
  }
}

async function renderPdfPageBlob(
  page: PDFPageProxy,
  scale: number,
  format: "image/png" | "image/jpeg",
) {
  const viewport = page.getViewport({ scale });
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

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, format, 0.92));

  if (!blob) {
    throw new Error("Gagal membuat gambar dari halaman PDF.");
  }

  return blob;
}
