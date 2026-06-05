import type { PdfToolId } from "@/lib/pdf/types";

export type ToolCategory = "Organize" | "Convert" | "Edit & Sign" | "Layout" | "Optimize" | "Local";

export type ToolSlug =
  | "merge-pdf"
  | "extract-pdf"
  | "organize-pdf"
  | "rotate-pdf"
  | "compress-pdf"
  | "pdf-to-image"
  | "image-to-pdf"
  | "watermark-pdf"
  | "page-numbers"
  | "sign-pdf"
  | "edit-metadata"
  | "crop-pdf"
  | "resize-pdf"
  | "n-up-pdf"
  | "fill-forms"
  | "local-history";

export type ToolCatalogItem = {
  id: PdfToolId;
  slug: ToolSlug;
  label: string;
  shortLabel: string;
  category: ToolCategory;
  description: string;
  homeDescription: string;
  defaultLayoutAction?: "crop" | "resize" | "blank" | "nup";
};

export const toolCatalog: ToolCatalogItem[] = [
  {
    id: "merge",
    slug: "merge-pdf",
    label: "Merge PDF",
    shortLabel: "Merge",
    category: "Organize",
    description: "Gabungkan beberapa PDF menjadi satu dokumen.",
    homeDescription: "Combine multiple PDFs into one tidy document.",
  },
  {
    id: "extract",
    slug: "extract-pdf",
    label: "Extract PDF",
    shortLabel: "Extract",
    category: "Organize",
    description: "Ambil halaman tertentu dari satu PDF.",
    homeDescription: "Separate one PDF into selected pages or ranges.",
  },
  {
    id: "organize",
    slug: "organize-pdf",
    label: "Organize PDF",
    shortLabel: "Organize",
    category: "Organize",
    description: "Hapus, urutkan, duplikasi, dan susun halaman.",
    homeDescription: "Reorder, delete, duplicate, and sort pages.",
  },
  {
    id: "rotate",
    slug: "rotate-pdf",
    label: "Rotate PDF",
    shortLabel: "Rotate",
    category: "Organize",
    description: "Putar halaman terpilih ke orientasi yang benar.",
    homeDescription: "Turn pages to the right orientation.",
  },
  {
    id: "pdf-to-image",
    slug: "pdf-to-image",
    label: "PDF to Image",
    shortLabel: "PDF to Image",
    category: "Convert",
    description: "Render halaman PDF menjadi PNG atau JPEG.",
    homeDescription: "Export a PDF page as a PNG or JPG.",
  },
  {
    id: "image-to-pdf",
    slug: "image-to-pdf",
    label: "Image to PDF",
    shortLabel: "Image to PDF",
    category: "Convert",
    description: "Ubah gambar PNG/JPEG menjadi dokumen PDF.",
    homeDescription: "Turn photos and scans into a PDF.",
  },
  {
    id: "watermark",
    slug: "watermark-pdf",
    label: "Watermark PDF",
    shortLabel: "Watermark",
    category: "Edit & Sign",
    description: "Tambahkan watermark teks ke halaman PDF.",
    homeDescription: "Stamp text across PDF pages.",
  },
  {
    id: "page-numbers",
    slug: "page-numbers",
    label: "Page Numbers",
    shortLabel: "Page Numbers",
    category: "Edit & Sign",
    description: "Tambahkan nomor halaman ke PDF.",
    homeDescription: "Add page numbers to the document.",
  },
  {
    id: "signature",
    slug: "sign-pdf",
    label: "Sign PDF",
    shortLabel: "Signature",
    category: "Edit & Sign",
    description: "Tempel gambar tanda tangan ke halaman PDF.",
    homeDescription: "Place a signature image on a PDF.",
  },
  {
    id: "metadata",
    slug: "edit-metadata",
    label: "Edit Metadata",
    shortLabel: "Metadata",
    category: "Edit & Sign",
    description: "Ubah title, author, subject, dan keywords.",
    homeDescription: "Update PDF title, author, and keywords.",
  },
  {
    id: "forms",
    slug: "fill-forms",
    label: "Fill Forms",
    shortLabel: "Forms",
    category: "Edit & Sign",
    description: "Isi field form teks dan flatten hasilnya.",
    homeDescription: "Fill native AcroForm text fields.",
  },
  {
    id: "layout",
    slug: "crop-pdf",
    label: "Crop PDF",
    shortLabel: "Crop PDF",
    category: "Layout",
    description: "Pangkas margin halaman PDF.",
    homeDescription: "Trim margins and tidy up the frame.",
    defaultLayoutAction: "crop",
  },
  {
    id: "layout",
    slug: "resize-pdf",
    label: "Resize PDF",
    shortLabel: "Resize PDF",
    category: "Layout",
    description: "Ubah ukuran halaman ke A4, Letter, atau Square.",
    homeDescription: "Fit pages to standard paper sizes.",
    defaultLayoutAction: "resize",
  },
  {
    id: "layout",
    slug: "n-up-pdf",
    label: "N-up PDF",
    shortLabel: "N-up PDF",
    category: "Layout",
    description: "Susun 2 atau 4 halaman ke satu halaman baru.",
    homeDescription: "Place multiple pages on each sheet.",
    defaultLayoutAction: "nup",
  },
  {
    id: "compress",
    slug: "compress-pdf",
    label: "Compress PDF",
    shortLabel: "Compress",
    category: "Optimize",
    description: "Optimasi ringan ukuran file di browser.",
    homeDescription: "Resave and optimize PDF structure locally.",
  },
  {
    id: "history",
    slug: "local-history",
    label: "Local History",
    shortLabel: "History",
    category: "Local",
    description: "Lihat hasil terakhir yang tersimpan lokal di IndexedDB.",
    homeDescription: "Access recent results stored on this device.",
  },
];

export const toolCategories: ToolCategory[] = ["Organize", "Convert", "Edit & Sign", "Layout", "Optimize", "Local"];

export function getToolBySlug(slug: string): ToolCatalogItem | undefined {
  return toolCatalog.find((tool) => tool.slug === slug);
}
