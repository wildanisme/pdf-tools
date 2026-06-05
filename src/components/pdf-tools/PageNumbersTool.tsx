"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Download, FileImage, FileText, ListRestart, Loader2, ShieldCheck, Trash2, Upload } from "lucide-react";
import { addPageNumbers, type PageNumberFormat, type PageNumberPosition } from "@/lib/pdf/operations/advanced";
import { renderPdfPagePreviewUrls } from "@/lib/pdf/renderPdfToImage";
import { NumberField, SelectField, TextField, requireActiveDocument } from "./shared";
import { downloadResult, formatBytes, usePdfToolController } from "./shared";
import styles from "./PdfTool.module.css";

const FORMAT_OPTIONS: Array<[PageNumberFormat, string]> = [
  ["number", "1 (just number)"],
  ["page", "Page n"],
  ["of-n", "1 of n"],
];

const POSITION_OPTIONS: Array<[PageNumberPosition, string]> = [
  ["bottom-center", "Bottom center"],
  ["bottom-right", "Bottom right"],
  ["top-center", "Top center"],
  ["top-right", "Top right"],
  ["center-right", "Center right"],
];

const POSITION_CLASSES: Record<PageNumberPosition, string> = {
  "bottom-center": "bottom-[6%] left-1/2 -translate-x-1/2",
  "bottom-right": "bottom-[6%] right-[6%]",
  "top-center": "top-[6%] left-1/2 -translate-x-1/2",
  "top-right": "top-[6%] right-[6%]",
  "center-right": "top-1/2 right-[6%] -translate-y-1/2",
};

export function PageNumbersTool() {
  const tool = usePdfToolController();
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [pagePreviewUrls, setPagePreviewUrls] = useState<string[]>([]);
  const [pagePreviewStatus, setPagePreviewStatus] = useState<"idle" | "loading" | "error">("idle");
  const [pagePreviewError, setPagePreviewError] = useState<string | null>(null);
  const [pageNumberFormat, setPageNumberFormat] = useState<PageNumberFormat>("page");
  const [pageNumberStart, setPageNumberStart] = useState(1);
  const [pageNumberPosition, setPageNumberPosition] = useState<PageNumberPosition>("bottom-center");

  const canProcess = tool.status !== "loading" && tool.status !== "processing" && tool.documents.length > 0;

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

  function getPageLabel(index: number): string {
    const pageNumber = pageNumberStart + index;
    const totalPages = tool.activeDocument?.pageCount ?? 0;

    switch (pageNumberFormat) {
      case "of-n":
        return `${pageNumber} of ${pageNumberStart + totalPages - 1}`;
      case "page":
        return `Page ${pageNumber}`;
      default:
        return `${pageNumber}`;
    }
  }

  return (
    <main className={styles.workspace}>
      <header className={styles.header}>
        <div className={styles.brandGroup}>
          <div className={styles.brandMark} aria-hidden="true"><span /></div>
          <div>
            <p className={styles.eyebrow}>Client-side PDF tool</p>
            <h1>Page Numbers</h1>
            <p className={styles.headerDescription}>Tambahkan nomor halaman ke PDF.</p>
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
                <small>{tool.activeDocument.pageCount} halaman</small>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-3.5 py-2.5">
                <p className="m-0 text-xs font-semibold text-slate-600">Preview nomor halaman sebelum export. Nomor akan diterapkan ke semua halaman.</p>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-slate-600 ring-1 ring-slate-200">
                  2 kolom
                </span>
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
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" role="list" aria-label="PDF pages">
                    {Array.from({ length: tool.activeDocument.pageCount }, (_, index) => {
                      const previewUrl = pagePreviewUrls[index];
                      const pageLabel = getPageLabel(index);

                      return (
                        <article key={index} className="grid gap-2 rounded-lg border border-slate-200 bg-white p-2.5 shadow-[0_8px_24px_rgb(15_23_42_/_8%)]" role="listitem">
                          <span className="flex items-center justify-between gap-2">
                            <span className="text-sm font-extrabold text-slate-800">Page {index + 1}</span>
                            <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-extrabold text-emerald-700">{pageLabel}</span>
                          </span>
                          <span className="relative block aspect-[3/4] overflow-hidden rounded-md border border-slate-200 bg-white">
                            <span
                              className="block h-full w-full bg-contain bg-center bg-no-repeat"
                              style={previewUrl ? { backgroundImage: `url(${previewUrl})` } : undefined}
                              aria-hidden="true"
                            />
                            <span className={`absolute rounded bg-white/85 px-2 py-1 text-[11px] font-extrabold text-slate-950 shadow-sm ring-1 ring-slate-200 ${POSITION_CLASSES[pageNumberPosition]}`}>
                              {pageLabel}
                            </span>
                          </span>
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
            <span>Page Numbers</span>
            <ListRestart size={16} />
          </div>
          <div className={styles.optionStack}>
            <TextField label="Output name" value={tool.outputName} onChange={tool.setOutputName} placeholder="custom-result.pdf" />
            <SelectField label="Format" value={pageNumberFormat} onChange={(value) => setPageNumberFormat(value as PageNumberFormat)} options={FORMAT_OPTIONS} />
            <SelectField label="Position" value={pageNumberPosition} onChange={(value) => setPageNumberPosition(value as PageNumberPosition)} options={POSITION_OPTIONS} />
            <NumberField label="Start at" value={pageNumberStart} onChange={setPageNumberStart} min={0} max={9999} />
            <span className={styles.helpText}>
              {tool.activeDocument
                ? `Nomor akan diterapkan ke ${tool.activeDocument.pageCount} halaman.`
                : "Pilih PDF terlebih dahulu."}
            </span>
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
            <button className={styles.primaryButton} type="button" onClick={() => void tool.handleProcess(() => {
              const doc = requireActiveDocument(tool.activeDocument);
              return addPageNumbers(doc.bytes, {
                format: pageNumberFormat,
                startAt: pageNumberStart,
                totalPages: doc.pageCount,
                position: pageNumberPosition,
              });
            })} disabled={!(canProcess)}>
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
