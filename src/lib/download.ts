import { toArrayBuffer } from "@/lib/bytes";

export function downloadBytes(bytes: Uint8Array, fileName: string, type = "application/pdf") {
  const blob = new Blob([toArrayBuffer(bytes)], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  anchor.click();

  URL.revokeObjectURL(url);
}
