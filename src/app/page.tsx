import type { Metadata } from "next";
import {
  BadgeCheck,
  Crop,
  FileArchive,
  FileImage,
  FilePlus2,
  FileSignature,
  FileText,
  Files,
  Layers,
  ListRestart,
  PanelBottom,
  RotateCw,
  Scissors,
  ShieldCheck,
  Sparkles,
  Stamp,
  Type,
} from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";
import type { PdfToolId } from "@/lib/pdf/types";
import { toolCatalog, toolCategories } from "@/lib/tools/catalog";
import { SITE_URL, SITE_NAME } from "@/lib/constants";
import { OrganizationSchema } from "@/components/seo/Schema";

export const metadata: Metadata = {
  title: "Privacy-First PDF Tools for Modern Workflows",
  description:
    "Work on PDFs without giving them away. A complete suite of 20+ free, client-side PDF tools to merge, extract, sign, compress, and convert documents directly in your browser.",
  openGraph: {
    title: "Privacy-First PDF Tools for Modern Workflows",
    description:
      "Work on PDFs without giving them away. A complete suite of 20+ free, client-side PDF tools to merge, extract, sign, compress, and convert documents directly in your browser.",
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy-First PDF Tools for Modern Workflows",
    description:
      "Work on PDFs without giving them away. A complete suite of 20+ free, client-side PDF tools to merge, extract, sign, compress, and convert documents directly in your browser.",
    images: [`${SITE_URL}/og-image.png`],
  },
  alternates: {
    canonical: SITE_URL,
  },
};

const iconMap: Record<PdfToolId | "crop" | "resize" | "nup", ComponentType<{ className?: string; size?: number }>> = {
  merge: Files,
  extract: Scissors,
  organize: Layers,
  rotate: RotateCw,
  compress: FileArchive,
  "pdf-to-image": FileImage,
  "image-to-pdf": FilePlus2,
  watermark: Stamp,
  "page-numbers": ListRestart,
  signature: FileSignature,
  metadata: Type,
  layout: PanelBottom,
  forms: FileText,
  history: FileArchive,
  crop: Crop,
  resize: PanelBottom,
  nup: Layers,
};

export default function Home() {
  return (
    <main className="px-4 py-5 sm:px-6 lg:px-9 lg:py-10">
      <OrganizationSchema />
      <section className="mb-9 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_45px_rgb(15_23_42_/_10%)]">
        <div className="grid gap-7 p-6 sm:p-8 xl:grid-cols-[minmax(0,1fr)_340px] xl:p-12">
          <div className="flex min-w-0 flex-col justify-center">
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700">
              <Sparkles size={16} />
              The Best PDF Tools Number 2 In The Universe
            </div>
            <h1 className="m-0 max-w-3xl text-4xl font-black leading-[1.04] tracking-normal text-slate-950 sm:text-5xl lg:text-6xl">
              Work on PDFs without <span className="text-emerald-600">giving them away.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base font-medium leading-relaxed text-slate-600 sm:text-lg">
              Merge, extract, sign, compress, convert, and clean up documents directly in your browser.
              The app loads from the web; your files stay on your device.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-extrabold text-white shadow-[0_16px_32px_rgb(16_185_129_/_24%)] hover:bg-emerald-700"
                href="/merge-pdf"
              >
                <Files size={18} />
                Open Merge Tool
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-extrabold text-slate-800 hover:border-emerald-500/35 hover:bg-emerald-50"
                href="/sign-pdf"
              >
                <FileSignature size={18} />
                Add a Signature
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {["Runs in your browser", "No upload step", "Built for quick edits"].map((item) => (
                <span
                  key={item}
                  className="inline-flex min-h-9 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 shadow-sm"
                >
                  <BadgeCheck className="text-emerald-600" size={16} />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative hidden min-h-[280px] place-items-center xl:grid">
            <div className="absolute inset-4 rounded-full bg-emerald-100/70 blur-2xl" />
            <div className="relative grid size-64 place-items-center rounded-full border border-emerald-500/20 bg-gradient-to-br from-white to-emerald-50 shadow-[0_30px_80px_rgb(15_23_42_/_14%)]">
              <div className="grid size-32 place-items-center rounded-[34px] bg-gradient-to-br from-emerald-700 to-emerald-400 text-white shadow-[0_18px_45px_rgb(16_185_129_/_28%)]">
                <FileText size={58} />
              </div>
              <div className="absolute right-0 top-8 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-800 shadow-lg">
                <ShieldCheck className="text-emerald-600" size={17} />
                Your files stay local
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="m-0 text-2xl font-black tracking-normal">Tools for everyday PDF work</h2>
          <p className="m-0 mt-1 text-sm font-semibold text-slate-500">
            {toolCatalog.length} focused tools · {toolCategories.length} practical categories
          </p>
        </div>
      </div>

      <div className="grid gap-8">
        {toolCategories.map((category) => {
          const items = toolCatalog.filter((tool) => tool.category === category);
          if (items.length === 0) return null;

          return (
            <section key={category} aria-labelledby={`${category}-heading`}>
              <div className="mb-3 flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-emerald-600" />
                <h3 id={`${category}-heading`} className="m-0 text-sm font-extrabold text-slate-600">
                  {category}
                </h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 text-center">
                {items.map((tool) => {
                  const Icon = getIcon(tool);

                  return (
                    <Link
                      key={tool.slug}
                      className="group flex flex-col items-center justify-center min-h-40 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-500/30 hover:shadow-[0_18px_45px_rgb(15_23_42_/_10%)]"
                      href={`/${tool.slug}`}
                    >
                      <span className="mb-5 grid size-12 place-items-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white">
                        <Icon size={22} />
                      </span>
                      <strong className="block text-base font-black text-slate-950">{tool.label}</strong>
                      <span className="mt-3 block text-sm font-medium leading-relaxed text-slate-600">{tool.homeDescription}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}

function getIcon(tool: { id: PdfToolId; defaultLayoutAction?: "crop" | "resize" | "blank" | "nup" }) {
  if (tool.defaultLayoutAction === "crop") return iconMap.crop;
  if (tool.defaultLayoutAction === "resize") return iconMap.resize;
  if (tool.defaultLayoutAction === "nup") return iconMap.nup;
  return iconMap[tool.id];
}
