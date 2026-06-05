import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { Locator } from "@playwright/test";

export type BrowserFile = {
  name: string;
  mimeType: string;
  buffer: Buffer;
};

const tinyPngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lxn3dgAAAABJRU5ErkJggg==";

export function createImageFiles(count: number): BrowserFile[] {
  const imageBytes = Buffer.from(tinyPngBase64, "base64");

  return Array.from({ length: count }, (_, index) => ({
    name: `sample-${index + 1}.png`,
    mimeType: "image/png",
    buffer: imageBytes,
  }));
}

export async function createPdfFile(pageCount: number): Promise<BrowserFile> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);

  for (let index = 1; index <= pageCount; index += 1) {
    const page = pdf.addPage([420, 594]);
    page.drawText(`Page ${index}`, {
      x: 144,
      y: 300,
      size: 42,
      font,
      color: rgb(0.1, 0.55, 0.38),
    });
  }

  return {
    name: `${pageCount}-pages.pdf`,
    mimeType: "application/pdf",
    buffer: Buffer.from(await pdf.save()),
  };
}

export async function dropFiles(target: Locator, files: BrowserFile[]) {
  const droppedFiles = files.map((file) => ({
    name: file.name,
    mimeType: file.mimeType,
    bytes: [...file.buffer],
  }));

  await target.evaluate((node, payload) => {
    const dataTransfer = new DataTransfer();

    for (const file of payload) {
      dataTransfer.items.add(new File([new Uint8Array(file.bytes)], file.name, { type: file.mimeType }));
    }

    for (const eventName of ["dragover", "drop"]) {
      const event = new DragEvent(eventName, { bubbles: true, cancelable: true });
      Object.defineProperty(event, "dataTransfer", { value: dataTransfer });
      node.dispatchEvent(event);
    }
  }, droppedFiles);
}
