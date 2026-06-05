"use client";

import { ChangeEvent, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Download, FileText, FileSignature, Loader2, ShieldCheck, Trash2, Upload } from "lucide-react";
import { addSignatureImage, type ImageInput } from "@/lib/pdf/operations/advanced";
import { getErrorMessage, NumberField, readImageInputs, TextField, requireActiveDocument } from "./shared";
import { downloadResult, formatBytes, usePdfToolController } from "./shared";
import styles from "./PdfTool.module.css";

export function SignPdfTool() {
  const tool = usePdfToolController();
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [previewPage, setPreviewPage] = useState(1);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const [signatureImage, setSignatureImage] = useState<ImageInput | null>(null);
  const [signatureWidth, setSignatureWidth] = useState(140);
  const [pdfImagePage, setPdfImagePage] = useState(1);

  async function handleSignatureFiles(files: FileList | File[]) {
    try {
      tool.setError(null);
      const [nextImage] = await readImageInputs(files);
      setSignatureImage(nextImage ?? null);
    } catch (caughtError) {
      tool.setError(getErrorMessage(caughtError, "Gagal membaca signature."));
    }
  }

  function handleSignatureInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) void handleSignatureFiles(event.target.files);
    event.target.value = "";
  }

  const canProcess = tool.status !== "loading" && tool.status !== "processing" && tool.documents.length > 0 && Boolean(signatureImage);

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
            <h1>Sign PDF</h1>
            <p className={styles.headerDescription}>Tempel gambar tanda tangan ke halaman PDF.</p>
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
              <div className={styles.pageStrip} aria-label="Page thumbnails">
                {Array.from({ length: tool.activeDocument.pageCount }, (_, index) => (
                  <button
                    key={index}
                    type="button"
                    className={index + 1 === previewPage ? styles.pageChipActive : styles.pageChip}
                    onClick={() => {
                      setPreviewPage(index + 1);
                      setPdfImagePage(index + 1);
                    }}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              <div className={styles.previewSurfaceCompact}>
                <iframe className={styles.pdfFrameCompact} src={tool.activeDocumentUrl ?? undefined} title={`Preview ${tool.activeDocument.name}`} />
              </div>
            </section>
          ) : null}
        </div>

        <aside className={styles.actionPanel} aria-label="Tool options">
          <div className={styles.sectionHeader}>
            <span>Sign PDF</span>
            <FileSignature size={16} />
          </div>
          <div className={styles.optionStack}>
            <TextField label="Output name" value={tool.outputName} onChange={tool.setOutputName} placeholder="custom-result.pdf" />
            <button className={styles.secondaryButton} type="button" onClick={() => signatureInputRef.current?.click()}>Pilih signature</button>
            <input ref={signatureInputRef} className={styles.hiddenInput} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleSignatureInputChange} />
            <span className={styles.helpText}>{signatureImage?.name ?? "Belum ada gambar signature."}</span>
            <NumberField label="Page" value={pdfImagePage} onChange={setPdfImagePage} min={1} max={Math.max(1, tool.activeDocument?.pageCount ?? 1)} />
            <NumberField label="Width" value={signatureWidth} onChange={setSignatureWidth} min={40} max={320} />
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
            <button className={styles.primaryButton} type="button" onClick={() => void tool.handleProcess(() => { const document = requireActiveDocument(tool.activeDocument); if (!signatureImage) throw new Error("Pilih gambar tanda tangan terlebih dahulu."); return addSignatureImage(document.bytes, signatureImage, { pageIndex: Math.max(0, Math.min(document.pageCount - 1, pdfImagePage - 1)), width: signatureWidth }); })} disabled={!(canProcess)}>
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
