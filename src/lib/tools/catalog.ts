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
    homeDescription: "Bring separate files into one clean PDF in the order you choose.",
  },
  {
    id: "extract",
    slug: "extract-pdf",
    label: "Extract PDF",
    shortLabel: "Extract",
    category: "Organize",
    description: "Ambil halaman tertentu dari satu PDF.",
    homeDescription: "Pull out only the pages you need and leave the rest behind.",
  },
  {
    id: "organize",
    slug: "organize-pdf",
    label: "Organize PDF",
    shortLabel: "Organize",
    category: "Organize",
    description: "Hapus, urutkan, duplikasi, dan susun halaman.",
    homeDescription: "Rebuild page order, remove extras, or duplicate pages locally.",
  },
  {
    id: "rotate",
    slug: "rotate-pdf",
    label: "Rotate PDF",
    shortLabel: "Rotate",
    category: "Organize",
    description: "Putar halaman terpilih ke orientasi yang benar.",
    homeDescription: "Fix sideways or upside-down pages before you share the file.",
  },
  {
    id: "pdf-to-image",
    slug: "pdf-to-image",
    label: "PDF to Image",
    shortLabel: "PDF to Image",
    category: "Convert",
    description: "Render halaman PDF menjadi PNG atau JPEG.",
    homeDescription: "Turn a PDF page into an image for slides, chats, or previews.",
  },
  {
    id: "image-to-pdf",
    slug: "image-to-pdf",
    label: "Image to PDF",
    shortLabel: "Image to PDF",
    category: "Convert",
    description: "Ubah gambar PNG/JPEG menjadi dokumen PDF.",
    homeDescription: "Bundle screenshots, scans, and photos into a single PDF.",
  },
  {
    id: "watermark",
    slug: "watermark-pdf",
    label: "Watermark PDF",
    shortLabel: "Watermark",
    category: "Edit & Sign",
    description: "Tambahkan watermark teks ke halaman PDF.",
    homeDescription: "Place a clear text mark across pages before distribution.",
  },
  {
    id: "page-numbers",
    slug: "page-numbers",
    label: "Page Numbers",
    shortLabel: "Page Numbers",
    category: "Edit & Sign",
    description: "Tambahkan nomor halaman ke PDF.",
    homeDescription: "Add readable numbering so long documents are easier to reference.",
  },
  {
    id: "signature",
    slug: "sign-pdf",
    label: "Sign PDF",
    shortLabel: "Signature",
    category: "Edit & Sign",
    description: "Tempel gambar tanda tangan ke halaman PDF.",
    homeDescription: "Drop in a signature image without printing or scanning again.",
  },
  {
    id: "metadata",
    slug: "edit-metadata",
    label: "Edit Metadata",
    shortLabel: "Metadata",
    category: "Edit & Sign",
    description: "Ubah title, author, subject, dan keywords.",
    homeDescription: "Clean up document details before archiving or sending.",
  },
  {
    id: "forms",
    slug: "fill-forms",
    label: "Fill Forms",
    shortLabel: "Forms",
    category: "Edit & Sign",
    description: "Isi field form teks dan flatten hasilnya.",
    homeDescription: "Complete text fields and flatten the result into a final file.",
  },
  {
    id: "layout",
    slug: "crop-pdf",
    label: "Crop PDF",
    shortLabel: "Crop PDF",
    category: "Layout",
    description: "Pangkas margin halaman PDF.",
    homeDescription: "Trim empty edges and tighten the visible page area.",
    defaultLayoutAction: "crop",
  },
  {
    id: "layout",
    slug: "resize-pdf",
    label: "Resize PDF",
    shortLabel: "Resize PDF",
    category: "Layout",
    description: "Ubah ukuran halaman ke A4, Letter, atau Square.",
    homeDescription: "Resize pages for printing, sharing, or consistent formatting.",
    defaultLayoutAction: "resize",
  },
  {
    id: "layout",
    slug: "n-up-pdf",
    label: "N-up PDF",
    shortLabel: "N-up PDF",
    category: "Layout",
    description: "Susun 2 atau 4 halaman ke satu halaman baru.",
    homeDescription: "Fit multiple pages onto each sheet for compact handouts.",
    defaultLayoutAction: "nup",
  },
  {
    id: "compress",
    slug: "compress-pdf",
    label: "Compress PDF",
    shortLabel: "Compress",
    category: "Optimize",
    description: "Optimasi ringan ukuran file di browser.",
    homeDescription: "Resave and streamline the PDF without server-side processing.",
  },
  {
    id: "history",
    slug: "local-history",
    label: "Local History",
    shortLabel: "History",
    category: "Local",
    description: "Lihat hasil terakhir yang tersimpan lokal di IndexedDB.",
    homeDescription: "Revisit recent results saved in this browser only.",
  },
];

export const toolCategories: ToolCategory[] = ["Organize", "Convert", "Edit & Sign", "Layout", "Optimize", "Local"];

export function getToolBySlug(slug: string): ToolCatalogItem | undefined {
  return toolCatalog.find((tool) => tool.slug === slug);
}
