"use client";

import { ChangeEvent, useRef, useState } from "react";
import { Download, FileImage, FilePlus2, Loader2, ShieldCheck, Upload } from "lucide-react";
import { imagesToPdf, type ImageInput, type PageSizePreset } from "@/lib/pdf/operations/advanced";
import { downloadResult, formatBytes, getErrorMessage, NumberField, readImageInputs, SelectField, TextField, usePdfToolController } from "./shared";
import styles from "./PdfTool.module.css";

export function ImageToPdfTool() {
  const tool = usePdfToolController();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<ImageInput[]>([]);
  const [imagePageSize, setImagePageSize] = useState<PageSizePreset>("a4");
  const [imageMargin, setImageMargin] = useState(24);
  const canProcess = tool.status !== "loading" && tool.status !== "processing" && images.length > 0;

  async function handleImageFiles(files: FileList | File[]) {
    try {
      tool.setError(null);
      const nextImages = await readImageInputs(files);
      setImages((current) => [...current, ...nextImages]);
    } catch (caughtError) {
      tool.setError(getErrorMessage(caughtError, "Gagal membaca gambar."));
    }
  }

  function handleImageInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) void handleImageFiles(event.target.files);
    event.target.value = "";
  }

  return (
    <main className={styles.workspace}>
      <header className={styles.header}>
        <div className={styles.brandGroup}>
          <div className={styles.brandMark} aria-hidden="true"><span /></div>
          <div>
            <p className={styles.eyebrow}>Client-side PDF tool</p>
            <h1>Image to PDF</h1>
            <p className={styles.headerDescription}>Ubah gambar PNG/JPEG menjadi dokumen PDF.</p>
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
          <section className={styles.documentPanel} aria-label="Images and upload">
            <div className={styles.dropzone} role="button" tabIndex={0} onClick={() => imageInputRef.current?.click()} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); imageInputRef.current?.click(); } }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void handleImageFiles(event.dataTransfer.files); }}>
              <Upload size={24} />
              <div><h2>Upload images</h2><p>Tambahkan PNG, JPEG, atau WebP. Gambar tetap diproses di browser.</p></div>
              <button className={styles.secondaryButton} type="button" onClick={(event) => { event.stopPropagation(); imageInputRef.current?.click(); }}>Pilih gambar</button>
              <input ref={imageInputRef} className={styles.hiddenInput} type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={handleImageInputChange} />
            </div>
            <div className={styles.fileListHeader}><span>Images</span><span>{images.length} file</span></div>
            <div className={styles.imageListLarge}>
              {images.length === 0 ? <div className={styles.emptyState}><FileImage size={22} /><p>Belum ada gambar. Tambahkan gambar untuk membuat PDF.</p></div> : images.map((image, index) => <div key={`${image.name}-${index}`} className={styles.imageItem}><FileImage size={18} /><span>{image.name ?? `Image ${index + 1}`}</span></div>)}
            </div>
          </section>
        </div>
        <aside className={styles.actionPanel} aria-label="Tool options">
          <div className={styles.sectionHeader}><span>Image to PDF</span><FilePlus2 size={16} /></div>
          <div className={styles.optionStack}>
            <TextField label="Output name" value={tool.outputName} onChange={tool.setOutputName} placeholder="custom-result.pdf" />
            <SelectField label="Page size" value={imagePageSize} onChange={(value) => setImagePageSize(value as PageSizePreset)} options={[["a4", "A4"], ["letter", "Letter"], ["square", "Square"], ["original", "Fit image"]]} />
            <NumberField label="Margin" value={imageMargin} onChange={setImageMargin} min={0} max={144} />
            <span className={styles.helpText}>{images.length} gambar siap diproses.</span>
            {images.length > 0 ? <button className={styles.secondaryButton} type="button" onClick={() => setImages([])}>Bersihkan gambar</button> : null}
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
            <button className={styles.primaryButton} type="button" onClick={() => void tool.handleProcess(() => imagesToPdf(images, { pageSize: imagePageSize, margin: imageMargin }))} disabled={!(canProcess)}>
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
