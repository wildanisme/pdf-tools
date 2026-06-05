export type PdfToolId =
  | "merge"
  | "extract"
  | "organize"
  | "rotate"
  | "compress"
  | "image-to-pdf"
  | "pdf-to-image"
  | "watermark"
  | "page-numbers"
  | "signature"
  | "metadata"
  | "layout"
  | "forms"
  | "history";

export type PdfProcessingStatus = "idle" | "loading" | "processing" | "success" | "error";

export type PdfDocumentState = {
  id: string;
  name: string;
  size: number;
  bytes: Uint8Array;
  pageCount: number;
  createdAt: number;
};

export type PdfPageState = {
  documentId: string;
  pageIndex: number;
  label: string;
  rotation: 0 | 90 | 180 | 270;
  selected: boolean;
};

export type PdfOperation =
  | {
      type: "merge";
      documentIds: string[];
    }
  | {
      type: "extract";
      documentId: string;
      pageIndexes: number[];
    };

export type PdfProcessingResult = {
  fileName: string;
  bytes: Uint8Array;
  pageCount: number;
  mimeType?: string;
  sizeBefore?: number;
  sizeAfter?: number;
};
