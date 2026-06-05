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
  seoDescription: string;
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
    seoDescription:
      "Combine multiple PDF files into a single, organized document. Easily reorder files and merge them seamlessly in your browser. No uploads required.",
  },
  {
    id: "extract",
    slug: "extract-pdf",
    label: "Extract PDF",
    shortLabel: "Extract",
    category: "Organize",
    description: "Ambil halaman tertentu dari satu PDF.",
    homeDescription: "Pull out only the pages you need and leave the rest behind.",
    seoDescription:
      "Select and extract specific pages from any PDF document. Create a new, smaller PDF containing only the pages you need, all done locally.",
  },
  {
    id: "organize",
    slug: "organize-pdf",
    label: "Organize PDF",
    shortLabel: "Organize",
    category: "Organize",
    description: "Hapus, urutkan, duplikasi, dan susun halaman.",
    homeDescription: "Rebuild page order, remove extras, or duplicate pages locally.",
    seoDescription:
      "Easily reorder, rotate, or delete pages within your PDF. A simple, client-side tool for managing your document's structure.",
  },
  {
    id: "rotate",
    slug: "rotate-pdf",
    label: "Rotate PDF",
    shortLabel: "Rotate",
    category: "Organize",
    description: "Putar halaman terpilih ke orientasi yang benar.",
    homeDescription: "Fix sideways or upside-down pages before you share the file.",
    seoDescription:
      "Quickly fix the orientation of your PDF pages. Rotate individual or all pages to be upright and save the corrected file locally.",
  },
  {
    id: "pdf-to-image",
    slug: "pdf-to-image",
    label: "PDF to Image",
    shortLabel: "PDF to Image",
    category: "Convert",
    description: "Render halaman PDF menjadi PNG atau JPEG.",
    homeDescription: "Turn a PDF page into an image for slides, chats, or previews.",
    seoDescription:
      "Convert pages from a PDF document into high-quality JPG or PNG images. Perfect for presentations, social media, or web use.",
  },
  {
    id: "image-to-pdf",
    slug: "image-to-pdf",
    label: "Image to PDF",
    shortLabel: "Image to PDF",
    category: "Convert",
    description: "Ubah gambar PNG/JPEG menjadi dokumen PDF.",
    homeDescription: "Bundle screenshots, scans, and photos into a single PDF.",
    seoDescription:
      "Convert JPG, PNG, and other image formats into a universal PDF document. Combine multiple images into a single file for easy sharing and archiving.",
  },
  {
    id: "watermark",
    slug: "watermark-pdf",
    label: "Watermark PDF",
    shortLabel: "Watermark",
    category: "Edit & Sign",
    description: "Tambahkan watermark teks ke halaman PDF.",
    homeDescription: "Place a clear text mark across pages before distribution.",
    seoDescription:
      "Add a text watermark to your PDF documents to protect your work. Customize the text, opacity, and position, all on your local device.",
  },
  {
    id: "page-numbers",
    slug: "page-numbers",
    label: "Page Numbers",
    shortLabel: "Page Numbers",
    category: "Edit & Sign",
    description: "Tambahkan nomor halaman ke PDF.",
    homeDescription: "Add readable numbering so long documents are easier to reference.",
    seoDescription:
      "Add page numbers to your PDF for easy reference. Customize the position, format, and range of your page numbers securely in your browser.",
  },
  {
    id: "signature",
    slug: "sign-pdf",
    label: "Sign PDF",
    shortLabel: "Signature",
    category: "Edit & Sign",
    description: "Tempel gambar tanda tangan ke halaman PDF.",
    homeDescription: "Drop in a signature image without printing or scanning again.",
    seoDescription:
      "Electronically sign your PDF documents in seconds. Draw your signature or upload an image and place it anywhere on the document. No uploads needed.",
  },
  {
    id: "metadata",
    slug: "edit-metadata",
    label: "Edit Metadata",
    shortLabel: "Metadata",
    category: "Edit & Sign",
    description: "Ubah title, author, subject, dan keywords.",
    homeDescription: "Clean up document details before archiving or sending.",
    seoDescription:
      "View and edit the metadata of your PDF files. Change the title, author, subject, and keywords to clean up your document's properties locally.",
  },
  {
    id: "forms",
    slug: "fill-forms",
    label: "Fill Forms",
    shortLabel: "Forms",
    category: "Edit & Sign",
    description: "Isi field form teks dan flatten hasilnya.",
    homeDescription: "Complete text fields and flatten the result into a final file.",
    seoDescription:
      "Quickly fill out PDF forms directly in your browser. Enter text into form fields and create a non-editable, flattened PDF ready for sharing.",
  },
  {
    id: "layout",
    slug: "crop-pdf",
    label: "Crop PDF",
    shortLabel: "Crop PDF",
    category: "Layout",
    description: "Pangkas margin halaman PDF.",
    homeDescription: "Trim empty edges and tighten the visible page area.",
    seoDescription:
      "Trim the margins and remove unwanted white space from your PDF pages. Define a crop area to create a clean, professional-looking document.",
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
    seoDescription:
      "Change the page size of your PDF documents. Easily resize to standard formats like A4, Letter, or custom dimensions for printing or viewing.",
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
    seoDescription:
      "Arrange multiple PDF pages onto a single sheet (2-up or 4-up). A powerful tool for creating handouts and saving paper, processed locally.",
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
    seoDescription:
      "Reduce the file size of your PDF documents for easier sharing and storage. Our tool optimizes your PDF without compromising quality, right in your browser.",
  },
  {
    id: "history",
    slug: "local-history",
    label: "Local History",
    shortLabel: "History",
    category: "Local",
    description: "Lihat hasil terakhir yang tersimpan lokal di IndexedDB.",
    homeDescription: "Revisit recent results saved in this browser only.",
    seoDescription:
      "Access your recently processed files. Your local history is stored securely in your browser's IndexedDB and is never uploaded.",
  },
];

export const toolCategories: ToolCategory[] = ["Organize", "Convert", "Edit & Sign", "Layout", "Optimize", "Local"];

export function getToolBySlug(slug: string): ToolCatalogItem | undefined {
  return toolCatalog.find((tool) => tool.slug === slug);
}
