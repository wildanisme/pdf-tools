"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Download, FileImage, FileText, Layers, Loader2, ShieldCheck, Trash2, Upload } from "lucide-react";
import { deletePdfPages, duplicatePdfPages, reorderPdfPages, sortPdfPages } from "@/lib/pdf/operations/advanced";
import { renderPdfPagePreviewUrls } from "@/lib/pdf/renderPdfToImage";
import { PageRangeField, SelectField, TextField, parsePages, requireActiveDocument } from "./shared";
import { downloadResult, formatBytes, usePdfToolController } from "./shared";
import styles from "./PdfTool.module.css";

export function OrganizePdfTool() {
  const tool = usePdfToolController();
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [pageRange, setPageRange] = useState("1");
  const [pageOrder, setPageOrder] = useState("1");
  const [selectedPageIndexes, setSelectedPageIndexes] = useState<number[]>([]);
  const [pageOrderIndexes, setPageOrderIndexes] = useState<number[]>([]);
  const [pagePreviewUrls, setPagePreviewUrls] = useState<string[]>([]);
  const [pagePreviewStatus, setPagePreviewStatus] = useState<"idle" | "loading" | "error">("idle");
  const [pagePreviewError, setPagePreviewError] = useState<string | null>(null);
  const [draggedPageIndex, setDraggedPageIndex] = useState<number | null>(null);
  const [dragOverPageIndex, setDragOverPageIndex] = useState<number | null>(null);
  const [organizeAction, setOrganizeAction] = useState<"delete" | "reorder" | "duplicate" | "sort">("delete");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const canProcess = tool.status !== "loading" && tool.status !== "processing" && tool.documents.length > 0;

  useEffect(() => {
    const document = tool.activeDocument;
    const allPages = document ? Array.from({ length: document.pageCount }, (_, index) => index) : [];
    setSelectedPageIndexes(document ? [0] : []);
    setPageOrderIndexes(allPages);
    setPageRange(document ? "1" : "");
    setPageOrder(document ? formatPageIndexes(allPages) : "");
  }, [tool.activeDocument]);

  useEffect(() => {
    const document = tool.activeDocument;
    let cancelled = false;
    let urlsFromEffect: string[] = [];

    setPagePreviewUrls([]);
    setPagePreviewError(null);

    if (!document) {
      setPagePreviewStatus("idle");
      return;
    }

    setPagePreviewStatus("loading");

    renderPdfPagePreviewUrls(document.bytes, { pageCount: document.pageCount, scale: 0.22 })
      .then((urls) => {
        if (cancelled) {
          urls.forEach((url) => URL.revokeObjectURL(url));
          return;
        }

        urlsFromEffect = urls;
        setPagePreviewUrls(urls);
        setPagePreviewStatus("idle");
      })
      .catch((caughtError: unknown) => {
        if (cancelled) return;
        setPagePreviewError(caughtError instanceof Error ? caughtError.message : "Gagal membuat preview halaman.");
        setPagePreviewStatus("error");
      });

    return () => {
      cancelled = true;
      urlsFromEffect.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [tool.activeDocument]);

  function handlePdfInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) void tool.handlePdfFiles(event.target.files);
    event.target.value = "";
  }

  function handlePageRangeChange(value: string) {
    setPageRange(value);

    if (!tool.activeDocument) return;

    try {
      setSelectedPageIndexes(parsePages(value, tool.activeDocument.pageCount));
    } catch {
      // Keep the last valid checkbox state while the user is editing an invalid range.
    }
  }

  function handlePageOrderChange(value: string) {
    setPageOrder(value);

    if (!tool.activeDocument) return;

    try {
      setPageOrderIndexes(parsePages(value, tool.activeDocument.pageCount));
    } catch {
      // Keep the last valid visual order while the user is editing an invalid order.
    }
  }

  function togglePageSelection(pageIndex: number) {
    setSelectedPageIndexes((current) => {
      const next = current.includes(pageIndex) ? current.filter((selectedPage) => selectedPage !== pageIndex) : [...current, pageIndex].sort((first, second) => first - second);
      setPageRange(formatPageIndexes(next));
      return next;
    });
  }

  function selectAllPages() {
    if (!tool.activeDocument) return;
    const next = Array.from({ length: tool.activeDocument.pageCount }, (_, index) => index);
    setSelectedPageIndexes(next);
    setPageRange(formatPageIndexes(next));
  }

  function clearSelectedPages() {
    setSelectedPageIndexes([]);
    setPageRange("");
  }

  function movePageInOrder(pageIndex: number, direction: -1 | 1) {
    setPageOrderIndexes((current) => {
      const index = current.indexOf(pageIndex);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;

      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      setPageOrder(formatPageIndexes(next));
      return next;
    });
  }

  function reorderPage(draggedIndex: number, targetIndex: number) {
    if (draggedIndex === targetIndex) return;

    setPageOrderIndexes((current) => {
      const fromIndex = current.indexOf(draggedIndex);
      const toIndex = current.indexOf(targetIndex);
      if (fromIndex < 0 || toIndex < 0) return current;

      const next = [...current];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      setPageOrder(formatPageIndexes(next));
      return next;
    });
  }

  function handlePageDragStart(event: DragEvent<HTMLElement>, pageIndex: number) {
    if (organizeAction !== "reorder") return;

    setDraggedPageIndex(pageIndex);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(pageIndex));
  }

  function handlePageDragOver(event: DragEvent<HTMLElement>, pageIndex: number) {
    if (organizeAction !== "reorder") return;

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverPageIndex(pageIndex);
  }

  function handlePageDrop(event: DragEvent<HTMLElement>, targetPageIndex: number) {
    if (organizeAction !== "reorder") return;

    event.preventDefault();
    const sourcePageIndex = draggedPageIndex ?? Number(event.dataTransfer.getData("text/plain"));
    if (Number.isInteger(sourcePageIndex)) reorderPage(sourcePageIndex, targetPageIndex);
    setDraggedPageIndex(null);
    setDragOverPageIndex(null);
  }

  function stopPageDrag() {
    setDraggedPageIndex(null);
    setDragOverPageIndex(null);
  }

  return (
    <main className={styles.workspace}>
      <header className={styles.header}>
        <div className={styles.brandGroup}>
          <div className={styles.brandMark} aria-hidden="true"><span /></div>
          <div>
            <p className={styles.eyebrow}>Client-side PDF tool</p>
            <h1>Organize PDF</h1>
            <p className={styles.headerDescription}>Hapus, urutkan, duplikasi, dan susun halaman.</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.privacyPill}>
            <ShieldCheck size={18} />
            <span>File tetap di perangkat Anda</span>
          </div>
        </div>
      </header>

      <section className={styles.toolWorkbench} aria-label="PDF tools workspace">
        <div className={styles.primaryColumn}>
          <section className={styles.documentPanel} aria-label="Files and upload">

              <div
                className={styles.dropzone}
                role="button"
                tabIndex={0}
                onClick={() => pdfInputRef.current?.click()}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    pdfInputRef.current?.click();
                  }
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  void tool.handlePdfFiles(event.dataTransfer.files);
                }}
              >
                <Upload size={24} />
                <div>
                  <h2>Upload PDF</h2>
                  <p>Drag-and-drop PDF atau pilih file. Dokumen tidak dikirim ke server.</p>
                </div>
                <button className={styles.secondaryButton} type="button" onClick={(event) => { event.stopPropagation(); pdfInputRef.current?.click(); }}>
                  Pilih PDF
                </button>
                <input ref={pdfInputRef} className={styles.hiddenInput} type="file" accept="application/pdf,.pdf" multiple onChange={handlePdfInputChange} />
              </div>

              <div className={styles.fileListHeader}>
                <span>Files</span>
                <span>{tool.documents.length} PDF</span>
              </div>

              <div className={styles.fileList}>
                {tool.documents.length === 0 ? (
                  <div className={styles.emptyState}>
                    <FileText size={22} />
                    <p>Belum ada PDF. Tambahkan file untuk mulai memakai tool.</p>
                  </div>
                ) : (
                  tool.documents.map((document, index) => (
                    <article key={document.id} className={document.id === tool.activeDocument?.id ? styles.fileItemActive : styles.fileItem}>
                      <button className={styles.fileMainButton} type="button" onClick={() => tool.setActiveDocumentId(document.id)} aria-label={`Pilih ${document.name}`}>
                        <FileText size={18} />
                        <span>
                          <strong>{document.name}</strong>
                          <small>{document.pageCount} halaman · {formatBytes(document.size)}</small>
                        </span>
                      </button>
                      <div className={styles.fileActions}>
                        <button type="button" aria-label="Pindah file ke atas" disabled={index === 0} onClick={() => tool.moveDocument(document.id, -1)}><ArrowUp size={15} /></button>
                        <button type="button" aria-label="Pindah file ke bawah" disabled={index === tool.documents.length - 1} onClick={() => tool.moveDocument(document.id, 1)}><ArrowDown size={15} /></button>
                        <button type="button" aria-label="Hapus file" onClick={() => tool.removeDocument(document.id)}><Trash2 size={15} /></button>
                      </div>
                    </article>
                  ))
                )}
              </div>
          </section>

          {tool.activeDocument ? (
            <section className={styles.previewPanel} aria-label="PDF preview">
              <div className={styles.previewToolbar}>
                <div>
                  <span>Selected PDF</span>
                  <strong>{tool.activeDocument.name}</strong>
                </div>
                <small>{getOrganizePreviewSummary(organizeAction, selectedPageIndexes.length, pageOrderIndexes.length, tool.activeDocument.pageCount)}</small>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-3.5 py-2.5">
                <p className="m-0 text-xs font-semibold text-slate-600">{getOrganizePreviewHelp(organizeAction)}</p>
                {organizeAction === "delete" || organizeAction === "duplicate" ? (
                  <div className="flex items-center gap-2">
                    <button className="min-h-8 rounded-md border border-slate-200 bg-white px-3 text-xs font-extrabold text-slate-700 hover:border-emerald-500/35 hover:bg-emerald-50" type="button" onClick={selectAllPages}>
                      Pilih semua
                    </button>
                    <button className="min-h-8 rounded-md border border-slate-200 bg-white px-3 text-xs font-extrabold text-slate-700 hover:border-emerald-500/35 hover:bg-emerald-50" type="button" onClick={clearSelectedPages}>
                      Bersihkan
                    </button>
                  </div>
                ) : null}
              </div>
              <div className="min-h-[360px] bg-slate-50 p-3.5">
                {pagePreviewStatus === "loading" ? (
                  <div className={styles.previewEmpty}>
                    <Loader2 className={styles.spin} size={22} />
                    <p>Membuat preview halaman...</p>
                  </div>
                ) : null}

                {pagePreviewStatus === "error" ? (
                  <div className={styles.previewEmpty}>
                    <FileImage size={22} />
                    <p>{pagePreviewError}</p>
                  </div>
                ) : null}

                {pagePreviewStatus === "idle" ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" role="list" aria-label="PDF pages">
                    {(organizeAction === "reorder" ? pageOrderIndexes : Array.from({ length: tool.activeDocument.pageCount }, (_, index) => index)).map((pageIndex, orderIndex) => {
                      const selected = selectedPageIndexes.includes(pageIndex);
                      const previewUrl = pagePreviewUrls[pageIndex];
                      const sortable = organizeAction === "reorder";
                      const selectable = organizeAction === "delete" || organizeAction === "duplicate";

                      return (
                        <article
                          key={pageIndex}
                          className={[
                            "grid gap-2 rounded-lg border bg-white p-2.5 shadow-[0_8px_24px_rgb(15_23_42_/_8%)] transition",
                            selectable ? "cursor-pointer" : "",
                            sortable ? "cursor-grab active:cursor-grabbing" : "",
                            draggedPageIndex === pageIndex ? "opacity-55" : "",
                            dragOverPageIndex === pageIndex && draggedPageIndex !== pageIndex ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20" : "",
                            selected && selectable ? "border-emerald-500 ring-2 ring-emerald-500/15" : "border-slate-200",
                          ].join(" ")}
                          role="listitem"
                          onClick={selectable ? () => togglePageSelection(pageIndex) : undefined}
                          draggable={sortable}
                          onDragStart={(event) => handlePageDragStart(event, pageIndex)}
                          onDragOver={(event) => handlePageDragOver(event, pageIndex)}
                          onDragLeave={() => setDragOverPageIndex((current) => current === pageIndex ? null : current)}
                          onDrop={(event) => handlePageDrop(event, pageIndex)}
                          onDragEnd={stopPageDrag}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-extrabold text-slate-800">
                              {sortable ? `Order ${orderIndex + 1}: Page ${pageIndex + 1}` : `Page ${pageIndex + 1}`}
                            </span>
                            {selectable ? (
                              <input
                                className="size-4 accent-emerald-600"
                                type="checkbox"
                                checked={selected}
                                onChange={() => togglePageSelection(pageIndex)}
                                onClick={(event) => event.stopPropagation()}
                                aria-label={`${organizeAction === "delete" ? "Delete" : "Duplicate"} page ${pageIndex + 1}`}
                              />
                            ) : null}
                            {sortable ? (
                              <div className="flex items-center gap-1">
                                <button className="grid size-7 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 hover:border-emerald-500/35 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-40" type="button" aria-label={`Move page ${pageIndex + 1} earlier`} disabled={orderIndex === 0} onClick={() => movePageInOrder(pageIndex, -1)}>
                                  <ArrowUp size={14} />
                                </button>
                                <button className="grid size-7 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 hover:border-emerald-500/35 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-40" type="button" aria-label={`Move page ${pageIndex + 1} later`} disabled={orderIndex === pageOrderIndexes.length - 1} onClick={() => movePageInOrder(pageIndex, 1)}>
                                  <ArrowDown size={14} />
                                </button>
                              </div>
                            ) : null}
                          </div>
                          <span className="block aspect-[3/4] rounded-md border border-slate-200 bg-white bg-contain bg-center bg-no-repeat" style={previewUrl ? { backgroundImage: `url(${previewUrl})` } : undefined} aria-hidden="true" />
                        </article>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}
        </div>

        <aside className={styles.actionPanel} aria-label="Tool options">
          <div className={styles.sectionHeader}>
            <span>Organize PDF</span>
            <Layers size={16} />
          </div>
          <div className={styles.optionStack}>
            <TextField label="Output name" value={tool.outputName} onChange={tool.setOutputName} placeholder="custom-result.pdf" />
            <SelectField label="Action" value={organizeAction} onChange={(value) => setOrganizeAction(value as "delete" | "reorder" | "duplicate" | "sort")} options={[["delete", "Delete pages"], ["reorder", "Reorder pages"], ["duplicate", "Duplicate pages"], ["sort", "Sort pages"]]} />
            {organizeAction === "reorder" ? (
              <TextField label="Page order" value={pageOrder} onChange={handlePageOrderChange} placeholder="3,1,2" help="Harus mencakup semua halaman tepat satu kali." />
            ) : organizeAction === "sort" ? (
              <SelectField label="Sort direction" value={sortDirection} onChange={(value) => setSortDirection(value as "asc" | "desc")} options={[["asc", "Ascending"], ["desc", "Descending"]]} />
            ) : (
              <PageRangeField value={pageRange} onChange={handlePageRangeChange} totalPages={tool.activeDocument?.pageCount ?? 0} />
            )}
          </div>

          {tool.error ? <div className={styles.errorBox}>{tool.error}</div> : null}

          {tool.status === "success" && tool.result ? (
            <div className={styles.successBox}>
              <strong>{tool.result.fileName} siap</strong>
              <span>
                {tool.result.mimeType?.startsWith("image/") ? "1 gambar" : `${tool.result.pageCount} halaman`}
                {tool.result.sizeBefore && tool.result.sizeAfter ? ` · ${formatBytes(tool.result.sizeBefore)} → ${formatBytes(tool.result.sizeAfter)}` : ""}
              </span>
            </div>
          ) : null}

          <div className={styles.actionButtons}>
            <button className={styles.primaryButton} type="button" onClick={() => void tool.handleProcess(() => { const document = requireActiveDocument(tool.activeDocument); if (organizeAction === "delete") return deletePdfPages(document.bytes, parsePages(pageRange, document.pageCount)); if (organizeAction === "reorder") return reorderPdfPages(document.bytes, parsePages(pageOrder, document.pageCount)); if (organizeAction === "duplicate") return duplicatePdfPages(document.bytes, parsePages(pageRange, document.pageCount)); return sortPdfPages(document.bytes, sortDirection); })} disabled={!(canProcess)}>
              {tool.status === "processing" || tool.status === "loading" ? <Loader2 className={styles.spin} size={18} /> : null}
              Proses
            </button>
            <button className={styles.secondaryButton} type="button" disabled={!tool.result} onClick={() => downloadResult(tool.result)}>
              <Download size={18} />
              Download
            </button>
            <button className={styles.secondaryButton} type="button" disabled={!tool.result || tool.result.mimeType?.startsWith("image/")} onClick={() => void tool.addResultToFiles()}>
              Tambah ke Files
            </button>
          </div>
        </aside>
      </section>
    </main>
  );
}

function getOrganizePreviewSummary(action: "delete" | "reorder" | "duplicate" | "sort", selectedCount: number, orderedCount: number, totalPages: number) {
  if (action === "reorder") return `${orderedCount} halaman diurutkan`;
  if (action === "sort") return `${totalPages} halaman akan disortir`;
  return `${selectedCount} dari ${totalPages} halaman dipilih`;
}

function getOrganizePreviewHelp(action: "delete" | "reorder" | "duplicate" | "sort") {
  if (action === "reorder") return "Gunakan tombol naik/turun pada kartu untuk menyusun ulang halaman.";
  if (action === "sort") return "Preview semua halaman. Arah sort diatur pada panel opsi.";
  if (action === "duplicate") return "Centang halaman yang ingin diduplikasi.";
  return "Centang halaman yang ingin dihapus dari PDF.";
}

function formatPageIndexes(pageIndexes: number[]) {
  return pageIndexes.map((pageIndex) => pageIndex + 1).join(",");
}
