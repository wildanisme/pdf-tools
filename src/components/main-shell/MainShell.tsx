"use client";

import {
  Crop,
  FileArchive,
  FileImage,
  FilePlus2,
  FileSignature,
  FileText,
  Files,
  Layers,
  ListRestart,
  Menu,
  PanelBottom,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCw,
  Scissors,
  Search,
  ShieldCheck,
  Stamp,
  Type,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ComponentType, ReactNode } from "react";
import type { PdfToolId } from "@/lib/pdf/types";
import { toolCatalog, toolCategories } from "@/lib/tools/catalog";

const iconMap: Record<PdfToolId | "crop" | "resize" | "nup", ComponentType<{ size?: number; className?: string }>> = {
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

type MainShellProps = {
  children: ReactNode;
};

export function MainShell({ children }: MainShellProps) {
  const pathname = usePathname();
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [toolSearch, setToolSearch] = useState("");

  return (
    <div
      className={[
        "min-h-screen bg-slate-50 text-slate-950",
        desktopSidebarOpen ? "lg:grid lg:grid-cols-[292px_minmax(0,1fr)]" : "lg:grid lg:grid-cols-[64px_minmax(0,1fr)]",
      ].join(" ")}
    >
      {desktopSidebarOpen ? (
        <aside className="hidden h-screen flex-col border-r border-slate-200 bg-white/90 p-3 lg:sticky lg:top-0 lg:flex">
          <SidebarContent
            pathname={pathname}
            searchQuery={toolSearch}
            onSearchChange={setToolSearch}
            onNavigate={() => undefined}
            onCollapse={() => setDesktopSidebarOpen(false)}
          />
        </aside>
      ) : (
        <aside className="hidden h-screen overflow-y-auto border-r border-slate-200 bg-white/90 px-2 py-3 lg:sticky lg:top-0 lg:flex lg:flex-col lg:items-center">
          <SidebarRail pathname={pathname} onExpand={() => setDesktopSidebarOpen(true)} />
        </aside>
      )}

      <div className="sticky top-0 z-40 flex min-h-12 items-center justify-between border-b border-slate-200 bg-white/90 px-3 backdrop-blur lg:hidden">
        <button
          className="grid size-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm active:bg-emerald-50"
          type="button"
          aria-label={mobileToolsOpen ? "Tutup daftar tools" : "Buka daftar tools"}
          aria-expanded={mobileToolsOpen}
          onClick={() => setMobileToolsOpen((open) => !open)}
        >
          <Menu size={20} />
        </button>
        <span className="rounded-full border border-emerald-500/25 bg-emerald-100/60 px-3 py-1.5 text-xs font-bold text-emerald-700">
          Local files
        </span>
      </div>

      <div className="min-w-0">{children}</div>

      {mobileToolsOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="PDF tools menu">
          <button
            className="absolute inset-0 z-0 h-full w-full bg-slate-950/40"
            type="button"
            aria-label="Tutup daftar tools"
            onClick={() => setMobileToolsOpen(false)}
          />
          <aside className="relative z-10 h-full w-[min(88vw,340px)] overflow-y-auto border-r border-slate-200 bg-white p-3 shadow-[20px_0_60px_rgb(15_23_42_/_22%)]">
            <SidebarContent
              pathname={pathname}
              searchQuery={toolSearch}
              onSearchChange={setToolSearch}
              onNavigate={() => setMobileToolsOpen(false)}
              onCollapse={() => setMobileToolsOpen(false)}
              mobile
            />
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function SidebarRail({ pathname, onExpand }: { pathname: string; onExpand: () => void }) {
  return (
    <>
      <button
        className="mb-3 grid size-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-emerald-500/35 hover:bg-emerald-50 hover:text-emerald-700"
        type="button"
        aria-label="Tampilkan sidebar tools"
        title="Tampilkan sidebar"
        onClick={onExpand}
      >
        <PanelLeftOpen size={20} />
      </button>

      <Link
        className={railClass(pathname === "/")}
        href="/"
        aria-label="Home"
        title="Home"
      >
        <FileText size={18} />
      </Link>

      <nav className="mt-3 grid gap-1.5" aria-label="PDF tools">
        {toolCatalog.map((tool) => {
          const Icon = getIcon(tool);
          const href = `/${tool.slug}`;

          return (
            <Link
              key={tool.slug}
              className={railClass(pathname === href)}
              href={href}
              aria-label={tool.label}
              title={tool.label}
            >
              <Icon size={18} />
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function SidebarContent({
  pathname,
  searchQuery,
  onSearchChange,
  onNavigate,
  onCollapse,
  mobile = false,
}: {
  pathname: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onNavigate: () => void;
  onCollapse: () => void;
  mobile?: boolean;
}) {
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const hasSearch = normalizedSearch.length > 0;
  const totalMatches = toolCatalog.filter((tool) => toolMatchesSearch(tool, normalizedSearch)).length;

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-20 -mx-3 -mt-3 mb-3 border-b border-slate-200 bg-white/95 px-3 pb-3 pt-3 backdrop-blur">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link className="flex min-w-0 items-center gap-3" href="/" onClick={onNavigate}>
            <div className="grid size-11 flex-none place-items-center rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-400 shadow-[0_14px_30px_rgb(16_185_129_/_22%)]">
              <FileText className="text-white" size={22} />
            </div>
            <div className="min-w-0">
              <strong className="block truncate text-lg tracking-normal">Privacy PDF</strong>
              <span className="block truncate text-xs font-semibold text-slate-500">PDF tools, on your device</span>
            </div>
          </Link>
          <button
            className="grid size-9 flex-none place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-emerald-500/35 hover:bg-emerald-50 hover:text-emerald-700"
            type="button"
            aria-label={mobile ? "Tutup daftar tools" : "Sembunyikan sidebar tools"}
            onClick={onCollapse}
          >
            {mobile ? <X size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        <label className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-slate-500 focus-within:border-emerald-500/40 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/15">
          <Search size={17} />
          <input
            className="min-w-0 flex-1 border-0 bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-500"
            type="search"
            value={searchQuery}
            placeholder="Search tools..."
            aria-label="Search PDF tools"
            onChange={(event) => onSearchChange(event.target.value)}
          />
          {hasSearch ? (
            <button
              className="grid size-7 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              type="button"
              aria-label="Clear tool search"
              onClick={() => onSearchChange("")}
            >
              <X size={15} />
            </button>
          ) : null}
        </label>

        {hasSearch ? (
          <div className="mt-2 px-1 text-xs font-semibold text-slate-500">
            {totalMatches} {totalMatches === 1 ? "tool" : "tools"} found
          </div>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto">
        <nav className="grid gap-5" aria-label="PDF tools">
          {!hasSearch ? (
            <Link className={navClass(pathname === "/")} href="/" onClick={onNavigate}>
              <FileText size={17} />
              Home
            </Link>
          ) : null}

          {toolCategories.map((category) => {
            const items = toolCatalog.filter((tool) => tool.category === category && toolMatchesSearch(tool, normalizedSearch));
            if (items.length === 0) return null;

            return (
              <div key={category}>
                <div className="mb-2 px-3 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
                  {category}
                </div>
                <div className="grid gap-1">
                  {items.map((tool) => {
                    const Icon = getIcon(tool);
                    const href = `/${tool.slug}`;

                    return (
                      <Link key={tool.slug} className={navClass(pathname === href)} href={href} onClick={onNavigate}>
                        <Icon size={17} />
                        {tool.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {hasSearch && totalMatches === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-semibold leading-relaxed text-slate-500">
              No tools match "{searchQuery.trim()}".
            </div>
          ) : null}
        </nav>
      </div>

      <div className="mt-auto shrink-0 pt-4">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-100/55 p-4 text-emerald-800">
          <div className="mb-1 flex items-center gap-2 text-sm font-extrabold">
            <ShieldCheck size={17} />
            Your file stay yours.
          </div>
          <p className="m-0 text-xs font-semibold leading-relaxed text-emerald-900/75">
            Your files never leave your computer. That’s our promise. We don't see your files. We don't want to.
          </p>
        </div>
      </div>
    </div>
  );
}

function navClass(active: boolean) {
  return [
    "flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold",
    active ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-700",
  ].join(" ");
}

function railClass(active: boolean) {
  return [
    "grid size-10 place-items-center rounded-lg text-slate-700 hover:bg-emerald-50 hover:text-emerald-700",
    active ? "bg-emerald-50 text-emerald-700" : "",
  ].join(" ");
}

function toolMatchesSearch(tool: (typeof toolCatalog)[number], search: string) {
  if (!search) return true;

  const searchableText = [
    tool.label,
    tool.shortLabel,
    tool.description,
    tool.homeDescription,
    tool.slug,
  ].join(" ").toLowerCase();

  return searchableText.includes(search);
}

function getIcon(tool: { id: PdfToolId; defaultLayoutAction?: "crop" | "resize" | "blank" | "nup" }) {
  if (tool.defaultLayoutAction === "crop") return iconMap.crop;
  if (tool.defaultLayoutAction === "resize") return iconMap.resize;
  if (tool.defaultLayoutAction === "nup") return iconMap.nup;
  return iconMap[tool.id];
}
