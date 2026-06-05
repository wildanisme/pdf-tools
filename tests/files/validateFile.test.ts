import { describe, expect, it } from "vitest";
import { formatFileSize, validatePdfFile } from "@/lib/files/validateFile";

describe("validatePdfFile", () => {
  it("accepts a non-empty PDF file under the size limit", () => {
    expect(validatePdfFile({ name: "document.pdf", size: 100, type: "application/pdf" })).toEqual({
      ok: true,
    });
  });

  it("rejects non-PDF files", () => {
    expect(validatePdfFile({ name: "image.png", size: 100, type: "image/png" })).toEqual({
      ok: false,
      error: "File harus berupa PDF.",
    });
  });

  it("rejects empty files", () => {
    expect(validatePdfFile({ name: "empty.pdf", size: 0, type: "application/pdf" })).toEqual({
      ok: false,
      error: "File PDF kosong.",
    });
  });

  it("formats file sizes for validation messages", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(1536)).toBe("1.5 KB");
    expect(formatFileSize(2 * 1024 * 1024)).toBe("2.0 MB");
  });
});
