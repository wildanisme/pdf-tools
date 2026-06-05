import { toArrayBuffer } from "@/lib/bytes";
import type { PdfProcessingResult } from "@/lib/pdf/types";
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

function createStoreZip(files: Array<{ name: string; bytes: Uint8Array }>) {
  const encoder = new TextEncoder();
  const fileRecords = [];
  const centralRecords = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const crc = crc32(file.bytes);
    const localHeader = new Uint8Array(30 + nameBytes.byteLength);
    const localView = new DataView(localHeader.buffer);

    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, 0, true);
    localView.setUint16(12, 0, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, file.bytes.byteLength, true);
    localView.setUint32(22, file.bytes.byteLength, true);
    localView.setUint16(26, nameBytes.byteLength, true);
    localView.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    const centralHeader = new Uint8Array(46 + nameBytes.byteLength);
    const centralView = new DataView(centralHeader.buffer);

    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, 0, true);
    centralView.setUint16(14, 0, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, file.bytes.byteLength, true);
    centralView.setUint32(24, file.bytes.byteLength, true);
    centralView.setUint16(28, nameBytes.byteLength, true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);

    fileRecords.push(localHeader, file.bytes);
    centralRecords.push(centralHeader);
    offset += localHeader.byteLength + file.bytes.byteLength;
  }

  const centralSize = centralRecords.reduce((total, record) => total + record.byteLength, 0);
  const endRecord = new Uint8Array(22);
  const endView = new DataView(endRecord.buffer);

  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);

  return concatenateBytes([...fileRecords, ...centralRecords, endRecord]);
}

function concatenateBytes(chunks: Uint8Array[]) {
  const totalLength = chunks.reduce((total, chunk) => total + chunk.byteLength, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return output;
}

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;

  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}
