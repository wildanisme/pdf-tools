"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { Download, FileImage, FileText, Type, Loader2, ShieldCheck, Trash2, Upload } from "lucide-react";
import { toArrayBuffer } from "@/lib/bytes";
import { editPdfMetadata } from "@/lib/pdf/operations/advanced";
import { renderPdfPageToImage } from "@/lib/pdf/renderPdfToImage";
import { createStoreZip } from "@/lib/zip/storeZip";
import { TextField } from "./shared";
import { downloadResult, ensurePdfName, formatBytes, usePdfToolController } from "./shared";
import styles from "./PdfTool.module.css";

export function EditMetadataTool() {
  const tool = usePdfToolController();
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [metadataTitle, setMetadataTitle] = useState("");
  const [metadataAuthor, setMetadataAuthor] = useState("");
  const [metadataSubject, setMetadataSubject] = useState("");
  const [metadataKeywords, setMetadataKeywords] = useState("");
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);

  const selectedDocuments = useMemo(
    () => tool.documents.filter((document) => selectedDocumentIds.includes(document.id)),
    [selectedDocumentIds, tool.documents],
  );
  const canProcess = tool.status !== "loading" && tool.status !== "processing" && selectedDocuments.length > 0;

  useEffect(() => {
    setSelectedDocumentIds((current) => {
      const existingIds = new Set(tool.documents.map((document) => document.id));
      const nextIds = current.filter((documentId) => existingIds.has(documentId));
      const currentIds = new Set(nextIds);

      for (const document of tool.documents) {
        if (!currentIds.has(document.id)) nextIds.push(document.id);
      }

      return nextIds;
    });
  }, [tool.documents]);

  function handlePdfInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) void tool.handlePdfFiles(event.target.files);
    event.target.value = "";
  }

  function toggleSelectedDocument(documentId: string) {
    setSelectedDocumentIds((current) => (
      current.includes(documentId)
        ? current.filter((selectedId) => selectedId !== documentId)
        : [...current, documentId]
    ));
  }

  async function processSelectedDocuments() {
    if (selectedDocuments.length === 0) {
      throw new Error("Pilih minimal satu file PDF.");
    }

    const metadata = {
      title: metadataTitle,
      author: metadataAuthor,
      subject: metadataSubject,
      keywords: metadataKeywords,
    };

    if (selectedDocuments.length === 1) {
      return editPdfMetadata(selectedDocuments[0].bytes, metadata);
    }

    const processedFiles = await Promise.all(
      selectedDocuments.map(async (document) => {
        const result = await editPdfMetadata(document.bytes, metadata);
        return {
          name: ensurePdfName(document.name.replace(/\.pdf$/i, "-metadata.pdf")),
          bytes: result.bytes,
        };
      }),
    );

    const sizeBefore = selectedDocuments.reduce((total, document) => total + document.size, 0);
    const zipBytes = createStoreZip(processedFiles);

    return {
      fileName: "metadata-pdfs.zip",
      bytes: zipBytes,
      pageCount: selectedDocuments.length,
      mimeType: "application/zip",
      sizeBefore,
      sizeAfter: zipBytes.byteLength,
    };
  }

  return (
    <main className={styles.workspace}>
      <header className={styles.header}>
        <div className={styles.brandGroup}>
          <div className={styles.brandMark} aria-hidden="true"><span /></div>
          <div>
            <p className={styles.eyebrow}>Client-side PDF tool</p>
            <h1>Edit Metadata</h1>
            <p className={styles.headerDescription}>Ubah title, author, subject, dan keywords.</p>
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
                <span>Metadata batch</span>
                <span>{selectedDocuments.length}/{tool.documents.length} dipilih</span>
              </div>

              {tool.documents.length > 0 ? (
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <button className={styles.secondaryButton} type="button" onClick={() => setSelectedDocumentIds(tool.documents.map((document) => document.id))}>
                    Pilih semua
                  </button>
                  <button className={styles.secondaryButton} type="button" onClick={() => setSelectedDocumentIds([])} disabled={selectedDocuments.length === 0}>
                    Kosongkan
                  </button>
                </div>
              ) : null}

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
                        "grid min-h-20 grid-cols-[56px_1fr] items-center gap-3 rounded-lg border bg-white p-2.5 text-sm font-bold text-slate-800 transition sm:grid-cols-[64px_1fr_auto]",
                        selectedDocumentIds.includes(document.id) ? "border-emerald-500/45 bg-emerald-50" : "border-slate-200",
                      ].join(" ")}
                    >
                      <MetadataThumbnail bytes={document.bytes} />
                      <button
                        className="min-w-0 text-left"
                        type="button"
                        onClick={() => toggleSelectedDocument(document.id)}
                        aria-label={`Pilih ${document.name} untuk batch metadata`}
                      >
                        <strong className="block overflow-hidden text-ellipsis whitespace-nowrap">{document.name}</strong>
                        <small className="mt-1 block overflow-hidden text-ellipsis whitespace-nowrap text-xs font-semibold text-slate-500">
                          File {index + 1} · {document.pageCount} halaman · {formatBytes(document.size)}
                        </small>
                      </button>
                      <div className="col-span-full flex items-center justify-end gap-2 sm:col-auto">
                        <label className="flex min-h-8 items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-extrabold text-slate-700">
                          <input
                            className="h-4 w-4 accent-emerald-600"
                            type="checkbox"
                            aria-label={`Pilih ${document.name} untuk batch metadata`}
                            checked={selectedDocumentIds.includes(document.id)}
                            onChange={() => toggleSelectedDocument(document.id)}
                          />
                          {selectedDocumentIds.includes(document.id) ? "Dipilih" : "Pilih"}
                        </label>
                        <button
                          className="grid size-8 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 hover:border-emerald-500/35 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-40"
                          type="button"
                          aria-label={`Hapus ${document.name}`}
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
            <span>Edit Metadata</span>
            <Type size={16} />
          </div>
          <div className={styles.optionStack}>
            <TextField label="Output name" value={tool.outputName} onChange={tool.setOutputName} placeholder="custom-result.pdf" />
            <TextField label="Title" value={metadataTitle} onChange={setMetadataTitle} />
            <TextField label="Author" value={metadataAuthor} onChange={setMetadataAuthor} />
            <TextField label="Subject" value={metadataSubject} onChange={setMetadataSubject} />
            <TextField label="Keywords" value={metadataKeywords} onChange={setMetadataKeywords} placeholder="privacy,pdf,local" />
            <span className={styles.helpText}>
              {selectedDocuments.length > 1
                ? `${selectedDocuments.length} file akan diproses dan diunduh sebagai ZIP.`
                : selectedDocuments.length === 1
                  ? "1 file akan diproses sebagai PDF."
                  : "Pilih minimal satu file PDF."}
            </span>
          </div>

          {tool.error ? <div className={styles.errorBox}>{tool.error}</div> : null}

          {tool.status === "success" && tool.result ? (
            <div className={styles.successBox}>
              <strong>{tool.result.fileName} siap</strong>
              <span>
                {tool.result.mimeType === "application/zip" ? `${tool.result.pageCount} file` : tool.result.mimeType?.startsWith("image/") ? "1 gambar" : `${tool.result.pageCount} halaman`}
                {tool.result.sizeBefore && tool.result.sizeAfter ? ` · ${formatBytes(tool.result.sizeBefore)} → ${formatBytes(tool.result.sizeAfter)}` : ""}
              </span>
            </div>
          ) : null}

          <div className={styles.actionButtons}>
            <button className={styles.primaryButton} type="button" onClick={() => void tool.handleProcess(processSelectedDocuments)} disabled={!(canProcess)}>
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

function MetadataThumbnail({ bytes }: { bytes: Uint8Array }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    setError(false);
    setUrl(null);

    renderPdfPageToImage(bytes, { pageIndex: 0, format: "image/png", scale: 0.3 })
      .then((result) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(new Blob([toArrayBuffer(result.bytes)], { type: "image/png" }));
        setUrl(objectUrl);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
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
