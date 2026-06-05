import { degrees, PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { PdfProcessingResult } from "@/lib/pdf/types";

export type ImageInput = {
  bytes: Uint8Array;
  type: "image/png" | "image/jpeg" | "image/webp";
  name?: string;
};

export type PageSizePreset = "original" | "a4" | "letter" | "square";

export type MetadataInput = {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
};

export type WatermarkPlacement = "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right" | "custom" | "tiled";

export type WatermarkOptions = {
  mode: "text" | "image";
  text?: string;
  image?: ImageInput | null;
  opacity: number;
  fontSize: number;
  rotation: number;
  color: string;
  placement: WatermarkPlacement;
  pageIndexes?: number[];
  xRatio?: number;
  yRatio?: number;
  imageWidthRatio?: number;
  repeat?: boolean;
};

const PAGE_SIZES: Record<Exclude<PageSizePreset, "original">, [number, number]> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
  square: [612, 612],
};

export async function deletePdfPages(bytes: Uint8Array, deleteIndexes: number[]): Promise<PdfProcessingResult> {
  const source = await PDFDocument.load(bytes);
  const totalPages = source.getPageCount();
  const deleteSet = new Set(deleteIndexes);
  const keepIndexes = source.getPageIndices().filter((index) => !deleteSet.has(index));

  if (keepIndexes.length === 0) {
    throw new Error("PDF harus menyisakan minimal satu halaman.");
  }

  validatePageIndexes(deleteIndexes, totalPages);
  return copySelectedPages(source, keepIndexes, "deleted-pages.pdf");
}

export async function reorderPdfPages(bytes: Uint8Array, pageIndexes: number[]): Promise<PdfProcessingResult> {
  const source = await PDFDocument.load(bytes);
  validatePageIndexes(pageIndexes, source.getPageCount());

  if (pageIndexes.length !== source.getPageCount()) {
    throw new Error("Urutan halaman harus mencakup semua halaman tepat satu kali.");
  }

  if (new Set(pageIndexes).size !== pageIndexes.length) {
    throw new Error("Urutan halaman tidak boleh berisi duplikat.");
  }

  return copySelectedPages(source, pageIndexes, "reordered-pages.pdf");
}

export async function duplicatePdfPages(bytes: Uint8Array, pageIndexes: number[]): Promise<PdfProcessingResult> {
  const source = await PDFDocument.load(bytes);
  validatePageIndexes(pageIndexes, source.getPageCount());
  const outputOrder = [...source.getPageIndices(), ...pageIndexes];
  return copySelectedPages(source, outputOrder, "duplicated-pages.pdf");
}

export async function sortPdfPages(bytes: Uint8Array, direction: "asc" | "desc"): Promise<PdfProcessingResult> {
  const source = await PDFDocument.load(bytes);
  const pageIndexes = source.getPageIndices();
  return copySelectedPages(source, direction === "asc" ? pageIndexes : pageIndexes.reverse(), "sorted-pages.pdf");
}

export async function rotatePdfPages(
  bytes: Uint8Array,
  pageIndexes: number[],
  rotation: 90 | 180 | 270,
): Promise<PdfProcessingResult> {
  const pdf = await PDFDocument.load(bytes);
  validatePageIndexes(pageIndexes, pdf.getPageCount());

  for (const pageIndex of pageIndexes) {
    const page = pdf.getPage(pageIndex);
    const currentAngle = page.getRotation().angle;
    page.setRotation(degrees((currentAngle + rotation) % 360));
  }

  return savePdf(pdf, "rotated-pages.pdf");
}

export async function rotatePdfPagesByDegrees(
  bytes: Uint8Array,
  rotations: Array<{ pageIndex: number; rotation: 0 | 90 | 180 | 270 }>,
): Promise<PdfProcessingResult> {
  const pdf = await PDFDocument.load(bytes);
  const activeRotations = rotations.filter((item) => item.rotation !== 0);

  if (activeRotations.length === 0) {
    throw new Error("Pilih minimal satu halaman untuk diputar.");
  }

  validatePageIndexes(activeRotations.map((item) => item.pageIndex), pdf.getPageCount());

  for (const item of activeRotations) {
    const page = pdf.getPage(item.pageIndex);
    const currentAngle = page.getRotation().angle;
    page.setRotation(degrees((currentAngle + item.rotation) % 360));
  }

  return savePdf(pdf, "rotated-pages.pdf");
}

export async function compressPdf(bytes: Uint8Array): Promise<PdfProcessingResult> {
  const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
  pdf.setProducer("Privacy PDF Tools");
  pdf.setModificationDate(new Date());
  const outputBytes = await pdf.save({ useObjectStreams: true });

  return {
    fileName: "compressed.pdf",
    bytes: outputBytes,
    pageCount: pdf.getPageCount(),
    sizeBefore: bytes.byteLength,
    sizeAfter: outputBytes.byteLength,
  };
}

export async function imagesToPdf(
  images: ImageInput[],
  options: { pageSize: PageSizePreset; margin: number },
): Promise<PdfProcessingResult> {
  if (images.length === 0) {
    throw new Error("Pilih minimal satu gambar.");
  }

  const pdf = await PDFDocument.create();

  for (const imageInput of images) {
    if (imageInput.type === "image/webp") {
      throw new Error("WebP belum bisa ditanam langsung ke PDF. Gunakan PNG atau JPEG.");
    }

    const image =
      imageInput.type === "image/png" ? await pdf.embedPng(imageInput.bytes) : await pdf.embedJpg(imageInput.bytes);
    const [pageWidth, pageHeight] =
      options.pageSize === "original" ? [image.width + options.margin * 2, image.height + options.margin * 2] : PAGE_SIZES[options.pageSize];
    const page = pdf.addPage([pageWidth, pageHeight]);
    const maxWidth = Math.max(1, pageWidth - options.margin * 2);
    const maxHeight = Math.max(1, pageHeight - options.margin * 2);
    const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
    const width = image.width * scale;
    const height = image.height * scale;

    page.drawImage(image, {
      x: (pageWidth - width) / 2,
      y: (pageHeight - height) / 2,
      width,
      height,
    });
  }

  return savePdf(pdf, "images.pdf");
}

export async function addWatermark(
  bytes: Uint8Array,
  options: WatermarkOptions,
): Promise<PdfProcessingResult> {
  const pdf = await PDFDocument.load(bytes);
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pageIndexes = options.pageIndexes?.length ? options.pageIndexes : pdf.getPageIndices();
  const opacity = clamp(options.opacity, 0.02, 1);
  const rotation = degrees(options.rotation);
  const watermarkColor = parseWatermarkColor(options.color);
  const repeatWatermark = Boolean(options.repeat) || options.placement === "tiled";

  validatePageIndexes(pageIndexes, pdf.getPageCount());

  if (options.mode === "text" && !options.text?.trim()) {
    throw new Error("Teks watermark tidak boleh kosong.");
  }

  if (options.mode === "image" && !options.image) {
    throw new Error("Pilih gambar watermark terlebih dahulu.");
  }

  if (options.image?.type === "image/webp") {
    throw new Error("Watermark WebP belum didukung. Gunakan PNG atau JPEG.");
  }

  const watermarkImage = options.image
    ? options.image.type === "image/png"
      ? await pdf.embedPng(options.image.bytes)
      : await pdf.embedJpg(options.image.bytes)
    : null;

  for (const pageIndex of pageIndexes) {
    const page = pdf.getPage(pageIndex);
    const width = page.getWidth();
    const height = page.getHeight();

    if (options.mode === "image" && watermarkImage) {
      const itemWidth = width * clamp(options.imageWidthRatio ?? 0.32, 0.08, 0.82);
      const itemHeight = itemWidth * (watermarkImage.height / watermarkImage.width);

      if (repeatWatermark) {
        for (let y = -itemHeight; y < height + itemHeight; y += itemHeight + 96) {
          for (let x = -itemWidth; x < width + itemWidth; x += itemWidth + 120) {
            page.drawImage(watermarkImage, { x, y, width: itemWidth, height: itemHeight, opacity, rotate: rotation });
          }
        }
      } else {
        const position = getWatermarkPosition(options, width, height, itemWidth, itemHeight);
        page.drawImage(watermarkImage, { ...position, width: itemWidth, height: itemHeight, opacity, rotate: rotation });
      }

      continue;
    }

    const safeText = options.text?.trim() ?? "";
    const textWidth = font.widthOfTextAtSize(safeText, options.fontSize);
    const textHeight = options.fontSize;

    if (repeatWatermark) {
      for (let y = -textHeight; y < height + textHeight; y += options.fontSize * 3.1) {
        for (let x = -textWidth; x < width + textWidth; x += Math.max(textWidth + 120, 220)) {
          page.drawText(safeText, {
            x,
            y,
            size: options.fontSize,
            font,
            color: watermarkColor,
            opacity,
            rotate: rotation,
          });
        }
      }
    } else {
      const position = getWatermarkPosition(options, width, height, textWidth, textHeight);

      page.drawText(safeText, {
        ...position,
        size: options.fontSize,
        font,
        color: watermarkColor,
        opacity,
        rotate: rotation,
      });
    }
  }

  return savePdf(pdf, "watermarked.pdf");
}

export async function addPageNumbers(
  bytes: Uint8Array,
  options: { prefix: string; startAt: number },
): Promise<PdfProcessingResult> {
  const pdf = await PDFDocument.load(bytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  pdf.getPages().forEach((page, index) => {
    const label = `${options.prefix}${options.startAt + index}`;
    const size = 10;
    const textWidth = font.widthOfTextAtSize(label, size);

    page.drawText(label, {
      x: (page.getWidth() - textWidth) / 2,
      y: 24,
      size,
      font,
      color: rgb(0.28, 0.33, 0.41),
    });
  });

  return savePdf(pdf, "page-numbers.pdf");
}

export async function addSignatureImage(
  bytes: Uint8Array,
  imageInput: ImageInput,
  options: { pageIndex: number; width: number; xRatio?: number; yRatio?: number; widthRatio?: number },
): Promise<PdfProcessingResult> {
  if (imageInput.type === "image/webp") {
    throw new Error("Signature WebP belum didukung. Gunakan PNG atau JPEG.");
  }

  const pdf = await PDFDocument.load(bytes);
  validatePageIndexes([options.pageIndex], pdf.getPageCount());

  const image =
    imageInput.type === "image/png" ? await pdf.embedPng(imageInput.bytes) : await pdf.embedJpg(imageInput.bytes);
  const page = pdf.getPage(options.pageIndex);
  const width = Math.min(options.widthRatio ? page.getWidth() * options.widthRatio : options.width, page.getWidth() - 48);
  const height = width * (image.height / image.width);
  const x = options.xRatio === undefined ? page.getWidth() - width - 36 : clamp(options.xRatio * page.getWidth(), 0, page.getWidth() - width);
  const y = options.yRatio === undefined ? 36 : clamp(page.getHeight() - (options.yRatio * page.getHeight()) - height, 0, page.getHeight() - height);

  page.drawImage(image, {
    x,
    y,
    width,
    height,
  });

  return savePdf(pdf, "signed.pdf");
}

export async function editPdfMetadata(bytes: Uint8Array, metadata: MetadataInput): Promise<PdfProcessingResult> {
  const pdf = await PDFDocument.load(bytes, { updateMetadata: false });

  if (metadata.title) pdf.setTitle(metadata.title, { showInWindowTitleBar: true });
  if (metadata.author) {
    pdf.setAuthor(metadata.author);
    pdf.setCreator(metadata.author);
  }
  if (metadata.subject) pdf.setSubject(metadata.subject);
  if (metadata.keywords) pdf.setKeywords(metadata.keywords.split(",").map((keyword) => keyword.trim()).filter(Boolean));

  pdf.setProducer("Privacy PDF Tools");
  pdf.setModificationDate(new Date());
  return savePdf(pdf, "metadata.pdf");
}

export async function cropPdfPages(bytes: Uint8Array, margin: number): Promise<PdfProcessingResult> {
  const pdf = await PDFDocument.load(bytes);
  const safeMargin = Math.max(0, margin);

  for (const page of pdf.getPages()) {
    const width = page.getWidth();
    const height = page.getHeight();

    if (safeMargin * 2 >= width || safeMargin * 2 >= height) {
      throw new Error("Margin crop terlalu besar untuk ukuran halaman.");
    }

    page.setCropBox(safeMargin, safeMargin, width - safeMargin * 2, height - safeMargin * 2);
  }

  return savePdf(pdf, "cropped.pdf");
}

export async function resizePdfPages(bytes: Uint8Array, preset: Exclude<PageSizePreset, "original">): Promise<PdfProcessingResult> {
  const source = await PDFDocument.load(bytes);
  const output = await PDFDocument.create();
  const embeddedPages = await output.embedPages(source.getPages());
  const [targetWidth, targetHeight] = PAGE_SIZES[preset];

  for (const embeddedPage of embeddedPages) {
    const page = output.addPage([targetWidth, targetHeight]);
    const scale = Math.min(targetWidth / embeddedPage.width, targetHeight / embeddedPage.height);
    const width = embeddedPage.width * scale;
    const height = embeddedPage.height * scale;

    page.drawPage(embeddedPage, {
      x: (targetWidth - width) / 2,
      y: (targetHeight - height) / 2,
      width,
      height,
    });
  }

  return savePdf(output, "resized.pdf");
}

export async function insertBlankPages(
  bytes: Uint8Array,
  options: { afterPageIndex: number; count: number },
): Promise<PdfProcessingResult> {
  const source = await PDFDocument.load(bytes);
  const output = await PDFDocument.create();
  const pageIndexes = source.getPageIndices();
  const count = Math.max(1, Math.min(20, options.count));

  validatePageIndexes([options.afterPageIndex], source.getPageCount());

  for (const pageIndex of pageIndexes) {
    const [copiedPage] = await output.copyPages(source, [pageIndex]);
    output.addPage(copiedPage);

    if (pageIndex === options.afterPageIndex) {
      const width = copiedPage.getWidth();
      const height = copiedPage.getHeight();

      for (let index = 0; index < count; index += 1) {
        const blankPage = output.addPage([width, height]);
        blankPage.drawRectangle({ x: 0, y: 0, width: 1, height: 1, color: rgb(1, 1, 1), opacity: 0.01 });
      }
    }
  }

  return savePdf(output, "blank-pages.pdf");
}

export async function nUpPdfPages(bytes: Uint8Array, perPage: 2 | 4): Promise<PdfProcessingResult> {
  const source = await PDFDocument.load(bytes);
  const output = await PDFDocument.create();
  const embeddedPages = await output.embedPages(source.getPages());
  const targetWidth = 612;
  const targetHeight = 792;
  const columns = perPage === 2 ? 1 : 2;
  const rows = perPage === 2 ? 2 : 2;
  const cellWidth = targetWidth / columns;
  const cellHeight = targetHeight / rows;

  for (let index = 0; index < embeddedPages.length; index += perPage) {
    const page = output.addPage([targetWidth, targetHeight]);
    const group = embeddedPages.slice(index, index + perPage);

    group.forEach((embeddedPage, groupIndex) => {
      const column = groupIndex % columns;
      const row = Math.floor(groupIndex / columns);
      const scale = Math.min((cellWidth - 24) / embeddedPage.width, (cellHeight - 24) / embeddedPage.height);
      const width = embeddedPage.width * scale;
      const height = embeddedPage.height * scale;
      const x = column * cellWidth + (cellWidth - width) / 2;
      const y = targetHeight - (row + 1) * cellHeight + (cellHeight - height) / 2;

      page.drawPage(embeddedPage, { x, y, width, height });
    });
  }

  return savePdf(output, `n-up-${perPage}.pdf`);
}

export async function fillAndFlattenForms(bytes: Uint8Array, values: Record<string, string>): Promise<PdfProcessingResult> {
  const pdf = await PDFDocument.load(bytes);
  const form = pdf.getForm();

  for (const [name, value] of Object.entries(values)) {
    if (!name.trim()) continue;

    try {
      form.getTextField(name).setText(value);
    } catch {
      // Non-text or missing fields are skipped so one unsupported field does not
      // block flattening other supported text fields.
    }
  }

  form.flatten();
  return savePdf(pdf, "flattened-form.pdf");
}

async function copySelectedPages(source: PDFDocument, pageIndexes: number[], fileName: string): Promise<PdfProcessingResult> {
  const output = await PDFDocument.create();
  const copiedPages = await output.copyPages(source, pageIndexes);

  copiedPages.forEach((page) => output.addPage(page));
  return savePdf(output, fileName);
}

async function savePdf(pdf: PDFDocument, fileName: string): Promise<PdfProcessingResult> {
  const bytes = await pdf.save({ useObjectStreams: true });

  return {
    fileName,
    bytes,
    pageCount: pdf.getPageCount(),
    mimeType: "application/pdf",
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function parseWatermarkColor(color: string) {
  const match = color.trim().match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);

  if (!match) {
    return rgb(0.05, 0.48, 0.34);
  }

  return rgb(
    Number.parseInt(match[1], 16) / 255,
    Number.parseInt(match[2], 16) / 255,
    Number.parseInt(match[3], 16) / 255,
  );
}

function getWatermarkPosition(
  options: Pick<WatermarkOptions, "placement" | "xRatio" | "yRatio">,
  pageWidth: number,
  pageHeight: number,
  itemWidth: number,
  itemHeight: number,
) {
  const margin = 36;

  if (options.placement === "custom") {
    return {
      x: clamp((options.xRatio ?? 0.5) * pageWidth, 0, Math.max(0, pageWidth - itemWidth)),
      y: clamp(pageHeight - ((options.yRatio ?? 0.5) * pageHeight) - itemHeight, 0, Math.max(0, pageHeight - itemHeight)),
    };
  }

  if (options.placement === "top-left") {
    return { x: margin, y: pageHeight - itemHeight - margin };
  }

  if (options.placement === "top-right") {
    return { x: pageWidth - itemWidth - margin, y: pageHeight - itemHeight - margin };
  }

  if (options.placement === "bottom-left") {
    return { x: margin, y: margin };
  }

  if (options.placement === "bottom-right") {
    return { x: pageWidth - itemWidth - margin, y: margin };
  }

  return {
    x: (pageWidth - itemWidth) / 2,
    y: (pageHeight - itemHeight) / 2,
  };
}

function validatePageIndexes(pageIndexes: number[], totalPages: number) {
  if (pageIndexes.length === 0) {
    throw new Error("Pilih minimal satu halaman.");
  }

  for (const pageIndex of pageIndexes) {
    if (!Number.isInteger(pageIndex) || pageIndex < 0 || pageIndex >= totalPages) {
      throw new Error(`Index halaman ${pageIndex} tidak valid.`);
    }
  }
}
