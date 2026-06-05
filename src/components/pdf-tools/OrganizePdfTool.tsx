"use client";

import { ChangeEvent, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Download, FileText, Layers, Loader2, ShieldCheck, Trash2, Upload } from "lucide-react";
import { deletePdfPages, duplicatePdfPages, reorderPdfPages, sortPdfPages } from "@/lib/pdf/operations/advanced";
import { PageRangeField, SelectField, TextField, parsePages, requireActiveDocument } from "./shared";
import { downloadResult, formatBytes, usePdfToolController } from "./shared";
import styles from "./PdfTool.module.css";

export function OrganizePdfTool() {
  const tool = usePdfToolController();
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [previewPage, setPreviewPage] = useState(1);
  const [pageRange, setPageRange] = useState("1");
  const [pageOrder, setPageOrder] = useState("1");
  const [organizeAction, setOrganizeAction] = useState<"delete" | "reorder" | "duplicate" | "sort">("delete");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const canProcess = tool.status !== "loading" && tool.status !== "processing" && tool.documents.length > 0;

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
                      setPageRange(String(index + 1));
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
            <span>Organize PDF</span>
            <Layers size={16} />
          </div>
          <div className={styles.optionStack}>
            <TextField label="Output name" value={tool.outputName} onChange={tool.setOutputName} placeholder="custom-result.pdf" />
            <SelectField label="Action" value={organizeAction} onChange={(value) => setOrganizeAction(value as "delete" | "reorder" | "duplicate" | "sort")} options={[["delete", "Delete pages"], ["reorder", "Reorder pages"], ["duplicate", "Duplicate pages"], ["sort", "Sort pages"]]} />
            {organizeAction === "reorder" ? (
              <TextField label="Page order" value={pageOrder} onChange={setPageOrder} placeholder="3,1,2" help="Harus mencakup semua halaman tepat satu kali." />
            ) : organizeAction === "sort" ? (
              <SelectField label="Sort direction" value={sortDirection} onChange={(value) => setSortDirection(value as "asc" | "desc")} options={[["asc", "Ascending"], ["desc", "Descending"]]} />
            ) : (
              <PageRangeField value={pageRange} onChange={setPageRange} totalPages={tool.activeDocument?.pageCount ?? 0} />
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
