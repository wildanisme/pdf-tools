"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Download, FileImage, FileText, Loader2, RotateCcw, RotateCw, ShieldCheck, Trash2, Upload } from "lucide-react";
import { rotatePdfPagesByDegrees } from "@/lib/pdf/operations/advanced";
import { renderPdfPagePreviewUrls } from "@/lib/pdf/renderPdfToImage";
import { TextField, requireActiveDocument } from "./shared";
import { downloadResult, formatBytes, usePdfToolController } from "./shared";
import styles from "./PdfTool.module.css";

type PageRotation = 0 | 90 | 180 | 270;

export function RotatePdfTool() {
  const tool = usePdfToolController();
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [pageRotations, setPageRotations] = useState<Record<number, PageRotation>>({});
  const [pagePreviewUrls, setPagePreviewUrls] = useState<string[]>([]);
  const [pagePreviewStatus, setPagePreviewStatus] = useState<"idle" | "loading" | "error">("idle");
  const [pagePreviewError, setPagePreviewError] = useState<string | null>(null);

  const rotatedPageCount = Object.values(pageRotations).filter((rotation) => rotation !== 0).length;
  const canProcess = tool.status !== "loading" && tool.status !== "processing" && tool.documents.length > 0 && rotatedPageCount > 0;

  useEffect(() => {
    setActivePageIndex(0);
    setPageRotations({});
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

  function rotateActivePage(delta: 90 | 180 | 270) {
    setPageRotations((current) => {
      const currentRotation = current[activePageIndex] ?? 0;
      const nextRotation = ((currentRotation + delta) % 360) as PageRotation;
      return { ...current, [activePageIndex]: nextRotation };
    });
  }

  function resetActivePageRotation() {
    setPageRotations((current) => ({ ...current, [activePageIndex]: 0 }));
  }

  function resetAllRotations() {
    setPageRotations({});
  }

  function processRotations() {
    const document = requireActiveDocument(tool.activeDocument);

    return rotatePdfPagesByDegrees(
      document.bytes,
      Array.from({ length: document.pageCount }, (_, pageIndex) => ({
        pageIndex,
        rotation: pageRotations[pageIndex] ?? 0,
      })),
    );
  }

  return (
    <main className={styles.workspace}>
      <header className={styles.header}>
        <div className={styles.brandGroup}>
          <div className={styles.brandMark} aria-hidden="true"><span /></div>
          <div>
            <p className={styles.eyebrow}>Client-side PDF tool</p>
            <h1>Rotate PDF</h1>
            <p className={styles.headerDescription}>Putar halaman tertentu sebelum export PDF final.</p>
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
                <small>{rotatedPageCount} halaman diubah</small>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-3.5 py-2.5">
                <p className="m-0 text-xs font-semibold text-slate-600">Klik halaman, lalu pilih rotasi. Perubahan diterapkan setelah export.</p>
                <button className="min-h-8 rounded-md border border-slate-200 bg-white px-3 text-xs font-extrabold text-slate-700 hover:border-emerald-500/35 hover:bg-emerald-50 disabled:opacity-45" type="button" disabled={rotatedPageCount === 0} onClick={resetAllRotations}>
                  Reset semua
                </button>
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
                      const active = activePageIndex === index;
                      const rotation = pageRotations[index] ?? 0;
                      const previewUrl = pagePreviewUrls[index];

                      return (
                        <button
                          key={index}
                          className={[
                            "grid cursor-pointer gap-2 rounded-lg border bg-white p-2.5 text-left shadow-[0_8px_24px_rgb(15_23_42_/_8%)] transition",
                            active ? "border-emerald-500 ring-2 ring-emerald-500/15" : "border-slate-200 hover:border-emerald-500/40",
                          ].join(" ")}
                          type="button"
                          onClick={() => setActivePageIndex(index)}
                          aria-label={`Select page ${index + 1}`}
                        >
                          <span className="flex items-center justify-between gap-2">
                            <span className="text-sm font-extrabold text-slate-800">Page {index + 1}</span>
                            <span className={["rounded-full px-2 py-1 text-xs font-extrabold", rotation ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"].join(" ")}>
                              {rotation} deg
                            </span>
                          </span>
                          <span className="grid aspect-[3/4] place-items-center overflow-hidden rounded-md border border-slate-200 bg-white">
                            <span
                              className="block h-full w-full bg-contain bg-center bg-no-repeat transition-transform"
                              style={{
                                backgroundImage: previewUrl ? `url(${previewUrl})` : undefined,
                                transform: `rotate(${rotation}deg)`,
                              }}
                              aria-hidden="true"
                            />
                          </span>
                        </button>
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
            <span>Rotate PDF</span>
            <RotateCw size={16} />
          </div>
          <div className={styles.optionStack}>
            <TextField label="Output name" value={tool.outputName} onChange={tool.setOutputName} placeholder="custom-result.pdf" />
            <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <span className="text-xs font-extrabold text-slate-600">Selected page</span>
              <strong className="text-sm text-slate-950">Page {activePageIndex + 1}</strong>
              <span className={styles.helpText}>Current change: {pageRotations[activePageIndex] ?? 0} degrees</span>
              <div className="grid grid-cols-2 gap-2">
                <button className={styles.secondaryButton} type="button" disabled={!tool.activeDocument} onClick={() => rotateActivePage(270)}>
                  <RotateCcw size={16} />
                  Left 90
                </button>
                <button className={styles.secondaryButton} type="button" disabled={!tool.activeDocument} onClick={() => rotateActivePage(90)}>
                  <RotateCw size={16} />
                  Right 90
                </button>
                <button className={styles.secondaryButton} type="button" disabled={!tool.activeDocument} onClick={() => rotateActivePage(180)}>
                  180 deg
                </button>
                <button className={styles.secondaryButton} type="button" disabled={!tool.activeDocument || (pageRotations[activePageIndex] ?? 0) === 0} onClick={resetActivePageRotation}>
                  Reset
                </button>
              </div>
            </div>
            <span className={styles.helpText}>{rotatedPageCount} halaman memiliki perubahan rotasi sebelum export.</span>
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
            <button className={styles.primaryButton} type="button" onClick={() => void tool.handleProcess(processRotations)} disabled={!(canProcess)}>
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
