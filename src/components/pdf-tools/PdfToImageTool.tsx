"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Download, FileText, FileImage, Loader2, ShieldCheck, Trash2, Upload } from "lucide-react";
import { renderPdfPagePreviewUrls, renderPdfPagesToImages } from "@/lib/pdf/renderPdfToImage";
import { NumberField, SelectField, TextField, requireActiveDocument } from "./shared";
import { downloadResult, formatBytes, usePdfToolController } from "./shared";
import styles from "./PdfTool.module.css";

export function PdfToImageTool() {
  const tool = usePdfToolController();
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [selectedPageIndexes, setSelectedPageIndexes] = useState<number[]>([]);
  const [pagePreviewUrls, setPagePreviewUrls] = useState<string[]>([]);
  const [pagePreviewStatus, setPagePreviewStatus] = useState<"idle" | "loading" | "error">("idle");
  const [pagePreviewError, setPagePreviewError] = useState<string | null>(null);
  const [pdfImageScale, setPdfImageScale] = useState(1.5);
  const [pdfImageFormat, setPdfImageFormat] = useState<"image/png" | "image/jpeg">("image/png");

  const canProcess = tool.status !== "loading" && tool.status !== "processing" && tool.documents.length > 0 && selectedPageIndexes.length > 0;

  useEffect(() => {
    const document = tool.activeDocument;
    setSelectedPageIndexes(document ? Array.from({ length: document.pageCount }, (_, index) => index) : []);
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

  function togglePageSelection(pageIndex: number) {
    setSelectedPageIndexes((current) => current.includes(pageIndex) ? current.filter((selectedPage) => selectedPage !== pageIndex) : [...current, pageIndex].sort((first, second) => first - second));
  }

  function selectAllPages() {
    if (!tool.activeDocument) return;
    setSelectedPageIndexes(Array.from({ length: tool.activeDocument.pageCount }, (_, index) => index));
  }

  function clearSelectedPages() {
    setSelectedPageIndexes([]);
  }

  function handlePdfInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) void tool.handlePdfFiles(event.target.files);
    event.target.value = "";
  }

  return (
    <main className={styles.workspace}>
      <header className={styles.header}>
        <div className={styles.brandGroup}>
          <div className={styles.brandMark} aria-hidden="true"><span /></div>
          <div>
            <p className={styles.eyebrow}>Client-side PDF tool</p>
            <h1>PDF to Image</h1>
            <p className={styles.headerDescription}>Render halaman PDF menjadi PNG atau JPEG.</p>
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
                <small>{selectedPageIndexes.length} dari {tool.activeDocument.pageCount} halaman dipilih</small>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-3.5 py-2.5">
                <p className="m-0 text-xs font-semibold text-slate-600">Centang halaman yang ingin diexport menjadi gambar.</p>
                <div className="flex items-center gap-2">
                  <button className="min-h-8 rounded-md border border-slate-200 bg-white px-3 text-xs font-extrabold text-slate-700 hover:border-emerald-500/35 hover:bg-emerald-50" type="button" onClick={selectAllPages}>
                    Pilih semua
                  </button>
                  <button className="min-h-8 rounded-md border border-slate-200 bg-white px-3 text-xs font-extrabold text-slate-700 hover:border-emerald-500/35 hover:bg-emerald-50" type="button" onClick={clearSelectedPages}>
                    Bersihkan
                  </button>
                </div>
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
                    {Array.from({ length: tool.activeDocument.pageCount }, (_, index) => {
                      const checked = selectedPageIndexes.includes(index);
                      const previewUrl = pagePreviewUrls[index];

                      return (
                        <label
                          key={index}
                          className={[
                            "grid cursor-pointer gap-2 rounded-lg border bg-white p-2.5 shadow-[0_8px_24px_rgb(15_23_42_/_8%)] transition",
                            checked ? "border-emerald-500 ring-2 ring-emerald-500/15" : "border-slate-200 hover:border-emerald-500/40",
                          ].join(" ")}
                          role="listitem"
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span className="text-sm font-extrabold text-slate-800">Page {index + 1}</span>
                            <input
                              className="size-4 accent-emerald-600"
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePageSelection(index)}
                              aria-label={`Export page ${index + 1}`}
                            />
                          </span>
                          <span
                            className="block aspect-[3/4] rounded-md border border-slate-200 bg-white bg-contain bg-center bg-no-repeat"
                            style={previewUrl ? { backgroundImage: `url(${previewUrl})` } : undefined}
                            aria-hidden="true"
                          />
                        </label>
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
            <span>PDF to Image</span>
            <FileImage size={16} />
          </div>
          <div className={styles.optionStack}>
            <TextField label="Output name" value={tool.outputName} onChange={tool.setOutputName} placeholder="pdf-pages-images.zip" />
            <span className={styles.helpText}>
              {selectedPageIndexes.length} halaman akan diexport. Jika hanya satu halaman dipilih, output berupa gambar. Jika lebih dari satu, output berupa ZIP.
            </span>
            <NumberField label="Scale" value={pdfImageScale} onChange={setPdfImageScale} min={0.5} max={4} step={0.25} />
            <SelectField label="Format" value={pdfImageFormat} onChange={(value) => setPdfImageFormat(value as "image/png" | "image/jpeg")} options={[["image/png", "PNG"], ["image/jpeg", "JPEG"]]} />
          </div>

          {tool.error ? <div className={styles.errorBox}>{tool.error}</div> : null}

          {tool.status === "success" && tool.result ? (
            <div className={styles.successBox}>
              <strong>{tool.result.fileName} siap</strong>
              <span>
                {tool.result.mimeType?.startsWith("image/") ? "1 gambar" : tool.result.mimeType === "application/zip" ? `${tool.result.pageCount} gambar` : `${tool.result.pageCount} halaman`}
                {tool.result.sizeBefore && tool.result.sizeAfter ? ` · ${formatBytes(tool.result.sizeBefore)} → ${formatBytes(tool.result.sizeAfter)}` : ""}
              </span>
            </div>
          ) : null}

          <div className={styles.actionButtons}>
            <button className={styles.primaryButton} type="button" onClick={() => void tool.handleProcess(() => { const document = requireActiveDocument(tool.activeDocument); return renderPdfPagesToImages(document.bytes, { pageIndexes: selectedPageIndexes, format: pdfImageFormat, scale: pdfImageScale }); })} disabled={!(canProcess)}>
              {tool.status === "processing" || tool.status === "loading" ? <Loader2 className={styles.spin} size={18} /> : null}
              Proses
            </button>
            <button className={styles.secondaryButton} type="button" disabled={!tool.result} onClick={() => downloadResult(tool.result)}>
              <Download size={18} />
              Download
            </button>
            <button className={styles.secondaryButton} type="button" disabled={!tool.result || (tool.result.mimeType !== undefined && tool.result.mimeType !== "application/pdf")} onClick={() => void tool.addResultToFiles()}>
              Tambah ke Files
            </button>
          </div>
        </aside>
      </section>
    </main>
  );
}
