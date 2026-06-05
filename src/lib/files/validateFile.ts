export const DEFAULT_MAX_PDF_SIZE = 100 * 1024 * 1024;

export type FileValidationResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: string;
    };

export type FileLike = {
  name: string;
  size: number;
  type?: string;
};

export function validatePdfFile(
  file: FileLike,
  maxSize = DEFAULT_MAX_PDF_SIZE,
): FileValidationResult {
  const lowerName = file.name.toLowerCase();
  const hasPdfExtension = lowerName.endsWith(".pdf");
  const hasPdfMime = file.type === "application/pdf" || file.type === "";

  if (!hasPdfExtension && !hasPdfMime) {
    return { ok: false, error: "File harus berupa PDF." };
  }

  if (file.size <= 0) {
    return { ok: false, error: "File PDF kosong." };
  }

  if (file.size > maxSize) {
    return {
      ok: false,
      error: `Ukuran file melebihi batas ${formatFileSize(maxSize)}.`,
    };
  }

  return { ok: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
