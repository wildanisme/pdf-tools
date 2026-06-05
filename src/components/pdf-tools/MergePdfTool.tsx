"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Download, FileImage, FileText, Files, GripVertical, Loader2, ShieldCheck, Trash2, Upload } from "lucide-react";
import { toArrayBuffer } from "@/lib/bytes";
import { mergePdfDocuments } from "@/lib/pdf/operations/merge";
import { renderPdfPageToImage } from "@/lib/pdf/renderPdfToImage";
import { InfoBlock, TextField } from "./shared";
import { downloadResult, formatBytes, usePdfToolController } from "./shared";
import styles from "./PdfTool.module.css";

export function MergePdfTool() {
  const tool = usePdfToolController();
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [draggingDocumentId, setDraggingDocumentId] = useState<string | null>(null);
  const [dragOverDocumentId, setDragOverDocumentId] = useState<string | null>(null);

  const canProcess = tool.status !== "loading" && tool.status !== "processing" && tool.documents.length >= 2;

  function handlePdfInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) void tool.handlePdfFiles(event.target.files);
    event.target.value = "";
  }

  function handleDragStart(event: DragEvent<HTMLElement>, documentId: string) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", documentId);
    setDraggingDocumentId(documentId);
  }

  function handleDragOver(event: DragEvent<HTMLElement>, documentId: string) {
    if (!draggingDocumentId || draggingDocumentId === documentId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverDocumentId(documentId);
  }

  function handleDrop(event: DragEvent<HTMLElement>, targetDocumentId: string) {
    event.preventDefault();
    const draggedDocumentId = event.dataTransfer.getData("text/plain") || draggingDocumentId;

    if (!draggedDocumentId || draggedDocumentId === targetDocumentId) {
      resetDragState();
      return;
    }

    tool.setDocuments((current) => {
      const sourceIndex = current.findIndex((document) => document.id === draggedDocumentId);
      const targetIndex = current.findIndex((document) => document.id === targetDocumentId);

      if (sourceIndex === -1 || targetIndex === -1) return current;

      const next = [...current];
      const [draggedDocument] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, draggedDocument);
      return next;
    });
    resetDragState();
  }

  function resetDragState() {
    setDraggingDocumentId(null);
    setDragOverDocumentId(null);
  }

  return (
    <main className={styles.workspace}>
      <header className={styles.header}>
        <div className={styles.brandGroup}>
          <div className={styles.brandMark} aria-hidden="true"><span /></div>
          <div>
            <p className={styles.eyebrow}>Client-side PDF tool</p>
            <h1>Merge PDF</h1>
            <p className={styles.headerDescription}>Gabungkan beberapa PDF menjadi satu dokumen.</p>
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
                <span>Merge queue</span>
                <span>{tool.documents.length} PDF · drag untuk urutkan</span>
              </div>

              <div className="grid gap-2">
                {tool.documents.length === 0 ? (
                  <div className={styles.emptyState}>
                    <FileText size={22} />
                    <p>Belum ada PDF. Tambahkan file untuk mulai memakai tool.</p>
                  </div>
                ) : (
                  tool.documents.map((document, index) => (
                    <article
                      key={document.id}
                      className={[
                        "group grid min-h-20 cursor-grab grid-cols-[44px_56px_1fr] items-center gap-3 rounded-lg border bg-white p-2.5 text-sm font-bold text-slate-800 transition active:cursor-grabbing sm:grid-cols-[78px_64px_1fr_auto]",
                        draggingDocumentId === document.id ? "border-emerald-500/55 opacity-60" : "border-slate-200",
                        dragOverDocumentId === document.id ? "ring-2 ring-emerald-500/25" : "",
                      ].join(" ")}
                      draggable={tool.documents.length > 1}
                      onDragStart={(event) => handleDragStart(event, document.id)}
                      onDragEnter={() => {
                        if (draggingDocumentId && draggingDocumentId !== document.id) setDragOverDocumentId(document.id);
                      }}
                      onDragOver={(event) => handleDragOver(event, document.id)}
                      onDrop={(event) => handleDrop(event, document.id)}
                      onDragEnd={resetDragState}
                    >
                      <span className="flex cursor-grab items-center gap-1 rounded-md border border-transparent px-1.5 py-1 text-slate-400 transition group-hover:border-emerald-500/25 group-hover:bg-emerald-50 group-hover:text-emerald-700 group-focus-within:border-emerald-500/25 group-focus-within:bg-emerald-50 group-focus-within:text-emerald-700 active:cursor-grabbing" aria-hidden="true">
                        <GripVertical className="shrink-0" size={17} />
                        <span className="hidden text-[11px] font-extrabold text-emerald-700 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100 sm:inline">
                          Drag
                        </span>
                        <span className="sr-only">Drag</span>
                      </span>
                      <PdfThumbnail bytes={document.bytes} />
                      <div>
                        <strong className="block overflow-hidden text-ellipsis whitespace-nowrap">{document.name}</strong>
                        <small className="mt-1 block overflow-hidden text-ellipsis whitespace-nowrap text-xs font-semibold text-slate-500">
                          Position {index + 1} · {document.pageCount} halaman · {formatBytes(document.size)}
                        </small>
                      </div>
                      <div className="col-span-full flex items-center justify-end gap-1 sm:col-auto">
                        <button
                          className="grid size-8 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 hover:border-emerald-500/35 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-40"
                          type="button"
                          aria-label={`Pindah file ke atas`}
                          disabled={index === 0}
                          onClick={() => tool.moveDocument(document.id, -1)}
                        >
                          <ArrowUp size={15} />
                        </button>
                        <button
                          className="grid size-8 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 hover:border-emerald-500/35 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-40"
                          type="button"
                          aria-label={`Pindah file ke bawah`}
                          disabled={index === tool.documents.length - 1}
                          onClick={() => tool.moveDocument(document.id, 1)}
                        >
                          <ArrowDown size={15} />
                        </button>
                        <button
                          className="grid size-8 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 hover:border-emerald-500/35 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-40"
                          type="button"
                          aria-label={`Hapus file`}
                          onClick={() => tool.removeDocument(document.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
          </section>
        </div>

        <aside className={styles.actionPanel} aria-label="Tool options">
          <div className={styles.sectionHeader}>
            <span>Merge PDF</span>
            <Files size={16} />
          </div>
          <div className={styles.optionStack}>
            <TextField label="Output name" value={tool.outputName} onChange={tool.setOutputName} placeholder="custom-result.pdf" />
            <InfoBlock title="Merge PDF" text={`Gabungkan ${tool.documents.length} PDF sesuai urutan di panel Files.`} />
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
            <button className={styles.primaryButton} type="button" onClick={() => void tool.handleProcess(() => mergePdfDocuments(tool.documents))} disabled={!(canProcess)}>
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

function PdfThumbnail({ bytes }: { bytes: Uint8Array }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setError(false);

    renderPdfPageToImage(bytes, { pageIndex: 0, format: "image/png", scale: 0.3 })
      .then((result) => {
        if (cancelled) return;
        const objectUrl = URL.createObjectURL(new Blob([toArrayBuffer(result.bytes)], { type: "image/png" }));
        setUrl(objectUrl);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
      });

    return () => { cancelled = true; };
  }, [bytes]);

  if (error || !url) {
    return (
      <span className="grid size-14 shrink-0 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 sm:size-16" aria-hidden="true">
        <FileImage size={20} />
      </span>
    );
  }

  return (
    <span
      className="block size-14 shrink-0 rounded-lg border border-slate-200 bg-slate-100 bg-cover bg-center sm:size-16"
      style={{ backgroundImage: `url(${url})` }}
      aria-hidden="true"
    />
  );
}
