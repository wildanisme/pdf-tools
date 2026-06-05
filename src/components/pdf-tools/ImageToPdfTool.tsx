"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Download, FileImage, FilePlus2, GripVertical, Loader2, ShieldCheck, Trash2, Upload } from "lucide-react";
import { toArrayBuffer } from "@/lib/bytes";
import { imagesToPdf, type ImageInput, type PageSizePreset } from "@/lib/pdf/operations/advanced";
import { downloadResult, formatBytes, getErrorMessage, NumberField, readImageInputs, SelectField, TextField, usePdfToolController } from "./shared";
import styles from "./PdfTool.module.css";

type ImageQueueItem = ImageInput & {
  id: string;
};

export function ImageToPdfTool() {
  const tool = usePdfToolController();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<ImageQueueItem[]>([]);
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);
  const [dragOverImageId, setDragOverImageId] = useState<string | null>(null);
  const [imagePageSize, setImagePageSize] = useState<PageSizePreset>("a4");
  const [imageMargin, setImageMargin] = useState(24);
  const canProcess = tool.status !== "loading" && tool.status !== "processing" && images.length > 0;

  async function handleImageFiles(files: FileList | File[]) {
    try {
      tool.setError(null);
      const nextImages = await readImageInputs(files);
      setImages((current) => [...current, ...nextImages.map((image) => ({ ...image, id: crypto.randomUUID() }))]);
    } catch (caughtError) {
      tool.setError(getErrorMessage(caughtError, "Gagal membaca gambar."));
    }
  }

  function handleImageInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) void handleImageFiles(event.target.files);
    event.target.value = "";
  }

  function moveImage(imageId: string, direction: -1 | 1) {
    setImages((current) => {
      const index = current.findIndex((image) => image.id === imageId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;

      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
  }

  function reorderImage(draggedId: string, targetId: string) {
    if (draggedId === targetId) return;

    setImages((current) => {
      const draggedIndex = current.findIndex((image) => image.id === draggedId);
      const targetIndex = current.findIndex((image) => image.id === targetId);
      if (draggedIndex < 0 || targetIndex < 0) return current;

      const next = [...current];
      const [draggedItem] = next.splice(draggedIndex, 1);
      next.splice(targetIndex, 0, draggedItem);
      return next;
    });
  }

  function handleImageDragStart(event: DragEvent<HTMLElement>, imageId: string) {
    setDraggedImageId(imageId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", imageId);
  }

  function handleImageDragOver(event: DragEvent<HTMLElement>, imageId: string) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverImageId(imageId);
  }

  function handleImageDrop(event: DragEvent<HTMLElement>, targetId: string) {
    event.preventDefault();
    const draggedId = draggedImageId ?? event.dataTransfer.getData("text/plain");
    if (draggedId) reorderImage(draggedId, targetId);
    setDraggedImageId(null);
    setDragOverImageId(null);
  }

  function handleImageDragEnd() {
    setDraggedImageId(null);
    setDragOverImageId(null);
  }

  function removeImage(imageId: string) {
    setImages((current) => current.filter((image) => image.id !== imageId));
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
            <div className={["grid gap-2", images.length > 5 ? "max-h-[480px] overflow-y-auto pr-1" : ""].join(" ")} role="list">
              {images.length === 0 ? (
                <div className={styles.emptyState}><FileImage size={22} /><p>Belum ada gambar. Tambahkan gambar untuk membuat PDF.</p></div>
              ) : (
                images.map((image, index) => (
                  <article
                    key={image.id}
                    className={[
                      "grid min-h-20 cursor-grab grid-cols-[auto_56px_minmax(0,1fr)] items-center gap-3 rounded-lg border border-slate-200 bg-white p-2.5 text-sm font-bold text-slate-800 transition active:cursor-grabbing sm:grid-cols-[auto_64px_minmax(0,1fr)_auto]",
                      draggedImageId === image.id ? "opacity-55" : "",
                      dragOverImageId === image.id && draggedImageId !== image.id ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20" : "",
                    ].join(" ")}
                    role="listitem"
                    draggable
                    onDragStart={(event) => handleImageDragStart(event, image.id)}
                    onDragOver={(event) => handleImageDragOver(event, image.id)}
                    onDragLeave={() => setDragOverImageId((current) => current === image.id ? null : current)}
                    onDrop={(event) => handleImageDrop(event, image.id)}
                    onDragEnd={handleImageDragEnd}
                  >
                    <GripVertical className="text-slate-400" size={18} aria-hidden="true" />
                    <ImagePreview image={image} />
                    <span>
                      <strong className="block overflow-hidden text-ellipsis whitespace-nowrap">{image.name ?? `Image ${index + 1}`}</strong>
                      <small className="mt-1 block overflow-hidden text-ellipsis whitespace-nowrap text-xs font-semibold text-slate-500">Position {index + 1}</small>
                    </span>
                    <div className="col-span-full flex items-center justify-end gap-1 sm:col-auto">
                      <button
                        className="grid size-8 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 hover:border-emerald-500/35 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-40"
                        type="button"
                        aria-label={`Move ${image.name ?? `image ${index + 1}`} up`}
                        disabled={index === 0}
                        onClick={() => moveImage(image.id, -1)}
                      >
                        <ArrowUp size={15} />
                      </button>
                      <button
                        className="grid size-8 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 hover:border-emerald-500/35 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-40"
                        type="button"
                        aria-label={`Move ${image.name ?? `image ${index + 1}`} down`}
                        disabled={index === images.length - 1}
                        onClick={() => moveImage(image.id, 1)}
                      >
                        <ArrowDown size={15} />
                      </button>
                      <button
                        className="grid size-8 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 hover:border-emerald-500/35 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-40"
                        type="button"
                        aria-label={`Remove ${image.name ?? `image ${index + 1}`}`}
                        onClick={() => removeImage(image.id)}
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

function ImagePreview({ image }: { image: ImageInput }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(new Blob([toArrayBuffer(image.bytes)], { type: image.type }));
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [image]);

  if (!url) {
    return (
      <span className="grid size-14 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 sm:size-16" aria-hidden="true">
        <FileImage size={20} />
      </span>
    );
  }

  return <span className="block size-14 rounded-lg border border-slate-200 bg-slate-100 bg-cover bg-center sm:size-16" style={{ backgroundImage: `url(${url})` }} aria-hidden="true" />;
}
