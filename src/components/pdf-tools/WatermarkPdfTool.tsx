"use client";

import { ChangeEvent, PointerEvent, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Download, FileText, Image as ImageIcon, Loader2, ShieldCheck, Stamp, Trash2, Upload } from "lucide-react";
import { toArrayBuffer } from "@/lib/bytes";
import { addWatermark, type ImageInput, type WatermarkPlacement } from "@/lib/pdf/operations/advanced";
import { renderPdfPageToImage } from "@/lib/pdf/renderPdfToImage";
import { downloadResult, formatBytes, getErrorMessage, NumberField, parsePages, readImageInputs, requireActiveDocument, SelectField, TextField, usePdfToolController } from "./shared";
import styles from "./PdfTool.module.css";

type WatermarkMode = "text" | "image";
type PageScope = "all" | "current" | "range";

type WatermarkPreset = {
  label: string;
  text: string;
  color: string;
  opacity: number;
  rotation: number;
};

const WATERMARK_PRESETS: WatermarkPreset[] = [
  { label: "Private", text: "PRIVATE", color: "#0d7a56", opacity: 0.22, rotation: -35 },
  { label: "Draft", text: "DRAFT", color: "#475569", opacity: 0.18, rotation: -35 },
  { label: "Confidential", text: "CONFIDENTIAL", color: "#b91c1c", opacity: 0.2, rotation: -35 },
  { label: "Approved", text: "APPROVED", color: "#047857", opacity: 0.2, rotation: -20 },
  { label: "Paid", text: "PAID", color: "#2563eb", opacity: 0.2, rotation: -18 },
  { label: "Sample", text: "SAMPLE", color: "#7c3aed", opacity: 0.16, rotation: -35 },
];

export function WatermarkPdfTool() {
  const tool = usePdfToolController();
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const previewPageRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const [previewPage, setPreviewPage] = useState(1);
  const [pagePreviewUrl, setPagePreviewUrl] = useState<string | null>(null);
  const [pagePreviewStatus, setPagePreviewStatus] = useState<"idle" | "loading" | "error">("idle");
  const [pagePreviewError, setPagePreviewError] = useState<string | null>(null);
  const [watermarkMode, setWatermarkMode] = useState<WatermarkMode>("text");
  const [watermarkText, setWatermarkText] = useState("PRIVATE");
  const [watermarkImage, setWatermarkImage] = useState<ImageInput | null>(null);
  const [watermarkImageUrl, setWatermarkImageUrl] = useState<string | null>(null);
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.22);
  const [watermarkFontSize, setWatermarkFontSize] = useState(42);
  const [watermarkRotation, setWatermarkRotation] = useState(-35);
  const [watermarkColor, setWatermarkColor] = useState("#0d7a56");
  const [watermarkPlacement, setWatermarkPlacement] = useState<WatermarkPlacement>("center");
  const [customPosition, setCustomPosition] = useState({ x: 0.38, y: 0.42 });
  const [isDraggingWatermark, setIsDraggingWatermark] = useState(false);
  const [imageWidthPercent, setImageWidthPercent] = useState(32);
  const [pageScope, setPageScope] = useState<PageScope>("all");
  const [pageRange, setPageRange] = useState("1");

  const canProcess =
    tool.status !== "loading" &&
    tool.status !== "processing" &&
    tool.documents.length > 0 &&
    (watermarkMode === "text" ? watermarkText.trim().length > 0 : Boolean(watermarkImage));

  useEffect(() => {
    setPreviewPage(1);
    if (tool.activeDocument) setPageRange(`1-${tool.activeDocument.pageCount}`);
  }, [tool.activeDocument?.id, tool.activeDocument]);

  useEffect(() => {
    if (!watermarkImage) {
      setWatermarkImageUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(new Blob([toArrayBuffer(watermarkImage.bytes)], { type: watermarkImage.type }));
    setWatermarkImageUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [watermarkImage]);

  useEffect(() => {
    const document = tool.activeDocument;
    let cancelled = false;
    let objectUrl: string | null = null;

    setPagePreviewUrl(null);
    setPagePreviewError(null);

    if (!document) {
      setPagePreviewStatus("idle");
      return;
    }

    setPagePreviewStatus("loading");

    renderPdfPageToImage(document.bytes, {
      pageIndex: Math.max(0, Math.min(document.pageCount - 1, previewPage - 1)),
      format: "image/png",
      scale: 0.9,
    })
      .then((result) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(new Blob([toArrayBuffer(result.bytes)], { type: "image/png" }));
        setPagePreviewUrl(objectUrl);
        setPagePreviewStatus("idle");
      })
      .catch((caughtError: unknown) => {
        if (cancelled) return;
        setPagePreviewError(caughtError instanceof Error ? caughtError.message : "Gagal membuat preview halaman.");
        setPagePreviewStatus("error");
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [tool.activeDocument, previewPage]);

  function handlePdfInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) void tool.handlePdfFiles(event.target.files);
    event.target.value = "";
  }

  async function handleWatermarkImageFiles(files: FileList | File[]) {
    try {
      tool.setError(null);
      const [nextImage] = await readImageInputs(files);

      if (nextImage?.type === "image/webp") {
        throw new Error("Watermark WebP belum didukung. Gunakan PNG atau JPEG.");
      }

      setWatermarkImage(nextImage ?? null);
      setWatermarkMode("image");
    } catch (caughtError) {
      tool.setError(getErrorMessage(caughtError, "Gagal membaca gambar watermark."));
    }
  }

  function handleWatermarkImageInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) void handleWatermarkImageFiles(event.target.files);
    event.target.value = "";
  }

  function applyPreset(preset: WatermarkPreset) {
    setWatermarkMode("text");
    setWatermarkText(preset.text);
    setWatermarkColor(preset.color);
    setWatermarkOpacity(preset.opacity);
    setWatermarkRotation(preset.rotation);
  }

  function getSelectedPageIndexes(totalPages: number) {
    if (pageScope === "current") return [Math.max(0, Math.min(totalPages - 1, previewPage - 1))];
    if (pageScope === "range") return parsePages(pageRange, totalPages);
    return Array.from({ length: totalPages }, (_, index) => index);
  }

  function isPreviewPageInScope() {
    const document = tool.activeDocument;
    if (!document) return false;

    try {
      return getSelectedPageIndexes(document.pageCount).includes(previewPage - 1);
    } catch {
      return false;
    }
  }

  function getPreviewPointerPosition(event: PointerEvent<HTMLElement>) {
    const rect = previewPageRef.current?.getBoundingClientRect();
    if (!rect) return null;

    return {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    };
  }

  function handleWatermarkPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (watermarkPlacement !== "custom") return;

    const pointerPosition = getPreviewPointerPosition(event);
    if (!pointerPosition) return;

    dragOffsetRef.current = {
      x: pointerPosition.x - customPosition.x,
      y: pointerPosition.y - customPosition.y,
    };
    setIsDraggingWatermark(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleWatermarkPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!isDraggingWatermark || watermarkPlacement !== "custom") return;

    const pointerPosition = getPreviewPointerPosition(event);
    if (!pointerPosition) return;

    setCustomPosition({
      x: clamp(pointerPosition.x - dragOffsetRef.current.x, 0, 0.92),
      y: clamp(pointerPosition.y - dragOffsetRef.current.y, 0, 0.92),
    });
  }

  function stopWatermarkDrag(event: PointerEvent<HTMLDivElement>) {
    setIsDraggingWatermark(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function processWatermark() {
    const document = requireActiveDocument(tool.activeDocument);

    return addWatermark(document.bytes, {
      mode: watermarkMode,
      text: watermarkText,
      image: watermarkImage,
      opacity: watermarkOpacity,
      fontSize: watermarkFontSize,
      rotation: watermarkRotation,
      color: watermarkColor,
      placement: watermarkPlacement,
      pageIndexes: getSelectedPageIndexes(document.pageCount),
      xRatio: customPosition.x,
      yRatio: customPosition.y,
      imageWidthRatio: imageWidthPercent / 100,
    });
  }

  const watermarkVisible = isPreviewPageInScope();

  return (
    <main className={styles.workspace}>
      <header className={styles.header}>
        <div className={styles.brandGroup}>
          <div className={styles.brandMark} aria-hidden="true"><span /></div>
          <div>
            <p className={styles.eyebrow}>Client-side PDF tool</p>
            <h1>Watermark PDF</h1>
            <p className={styles.headerDescription}>Tambahkan watermark teks atau gambar ke PDF.</p>
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
                  <span>Live Preview</span>
                  <strong>{tool.activeDocument.name}</strong>
                </div>
                <small>{watermarkVisible ? "Watermark terlihat" : "Halaman ini tidak dipilih"}</small>
              </div>
              <div className={styles.pageStrip} aria-label="Page thumbnails">
                {Array.from({ length: tool.activeDocument.pageCount }, (_, index) => (
                  <button key={index} type="button" className={index + 1 === previewPage ? styles.pageChipActive : styles.pageChip} onClick={() => setPreviewPage(index + 1)}>
                    {index + 1}
                  </button>
                ))}
              </div>
              <div className="min-h-[420px] bg-slate-50 p-3.5">
                {pagePreviewStatus === "loading" ? (
                  <div className={styles.previewEmpty}>
                    <Loader2 className={styles.spin} size={22} />
                    <p>Membuat preview halaman...</p>
                  </div>
                ) : null}

                {pagePreviewStatus === "error" ? (
                  <div className={styles.previewEmpty}>
                    <Stamp size={22} />
                    <p>{pagePreviewError}</p>
                  </div>
                ) : null}

                {pagePreviewStatus === "idle" && pagePreviewUrl ? (
                  <div ref={previewPageRef} className="relative mx-auto w-fit max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_16px_42px_rgb(15_23_42_/_12%)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="block max-h-[68vh] max-w-full select-none" src={pagePreviewUrl} alt={`Preview page ${previewPage}`} draggable={false} />
                    {watermarkVisible ? (
                      <WatermarkPreviewOverlay
                        color={watermarkColor}
                        customPosition={customPosition}
                        fontSize={watermarkFontSize}
                        imageUrl={watermarkImageUrl}
                        imageWidthPercent={imageWidthPercent}
                        mode={watermarkMode}
                        opacity={watermarkOpacity}
                        placement={watermarkPlacement}
                        rotation={watermarkRotation}
                        text={watermarkText}
                        onPointerCancel={stopWatermarkDrag}
                        onPointerDown={handleWatermarkPointerDown}
                        onPointerMove={handleWatermarkPointerMove}
                        onPointerUp={stopWatermarkDrag}
                      />
                    ) : null}
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}
        </div>

        <aside className={styles.actionPanel} aria-label="Tool options">
          <div className={styles.sectionHeader}>
            <span>Watermark PDF</span>
            <Stamp size={16} />
          </div>
          <div className={styles.optionStack}>
            <TextField label="Output name" value={tool.outputName} onChange={tool.setOutputName} placeholder="custom-result.pdf" />
            <SelectField label="Mode" value={watermarkMode} onChange={(value) => setWatermarkMode(value as WatermarkMode)} options={[["text", "Text"], ["image", "Image"]]} />

            {watermarkMode === "text" ? (
              <>
                <TextField label="Watermark text" value={watermarkText} onChange={setWatermarkText} />
                <div className="grid gap-2">
                  <span className="text-xs font-extrabold text-slate-600">Presets</span>
                  <div className="grid grid-cols-2 gap-2">
                    {WATERMARK_PRESETS.map((preset) => (
                      <button key={preset.label} className="min-h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs font-extrabold text-slate-700 hover:border-emerald-500/35 hover:bg-emerald-50" type="button" onClick={() => applyPreset(preset)}>
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
                <NumberField label="Font size" value={watermarkFontSize} onChange={setWatermarkFontSize} min={12} max={140} />
              </>
            ) : (
              <>
                <button className={styles.secondaryButton} type="button" onClick={() => imageInputRef.current?.click()}>
                  <ImageIcon size={16} />
                  Pilih gambar watermark
                </button>
                <input ref={imageInputRef} className={styles.hiddenInput} type="file" accept="image/png,image/jpeg" onChange={handleWatermarkImageInputChange} />
                {watermarkImageUrl ? (
                  <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                    <div className="grid min-h-20 place-items-center rounded-md border border-dashed border-emerald-500/35 bg-white p-2">
                      <span className="block h-16 w-full bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${watermarkImageUrl})` }} aria-hidden="true" />
                    </div>
                    <span className={styles.helpText}>{watermarkImage?.name}</span>
                  </div>
                ) : (
                  <span className={styles.helpText}>Belum ada gambar watermark.</span>
                )}
                <NumberField label="Image width (%)" value={imageWidthPercent} onChange={setImageWidthPercent} min={8} max={82} />
              </>
            )}

            <label className={styles.field}>
              <span>Color</span>
              <input className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2" type="color" value={watermarkColor} onChange={(event) => setWatermarkColor(event.target.value)} />
            </label>
            <NumberField label="Opacity" value={watermarkOpacity} onChange={setWatermarkOpacity} min={0.02} max={0.9} step={0.02} />
            <NumberField label="Rotation" value={watermarkRotation} onChange={setWatermarkRotation} min={-90} max={90} step={5} />
            <SelectField
              label="Placement"
              value={watermarkPlacement}
              onChange={(value) => setWatermarkPlacement(value as WatermarkPlacement)}
              options={[
                ["center", "Center"],
                ["tiled", "Repeated / tiled"],
                ["custom", "Custom drag"],
                ["top-left", "Top left"],
                ["top-right", "Top right"],
                ["bottom-left", "Bottom left"],
                ["bottom-right", "Bottom right"],
              ]}
            />
            {watermarkPlacement === "custom" ? <span className={styles.helpText}>Drag watermark di preview untuk mengatur posisi.</span> : null}
            <SelectField label="Apply to" value={pageScope} onChange={(value) => setPageScope(value as PageScope)} options={[["all", "All pages"], ["current", "Current preview page"], ["range", "Page range"]]} />
            {pageScope === "range" ? <TextField label="Page range" value={pageRange} onChange={setPageRange} placeholder="1-3,5" /> : null}
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
            <button className={styles.primaryButton} type="button" onClick={() => void tool.handleProcess(processWatermark)} disabled={!(canProcess)}>
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

function WatermarkPreviewOverlay({
  color,
  customPosition,
  fontSize,
  imageUrl,
  imageWidthPercent,
  mode,
  opacity,
  placement,
  rotation,
  text,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  color: string;
  customPosition: { x: number; y: number };
  fontSize: number;
  imageUrl: string | null;
  imageWidthPercent: number;
  mode: WatermarkMode;
  opacity: number;
  placement: WatermarkPlacement;
  rotation: number;
  text: string;
  onPointerCancel: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLDivElement>) => void;
}) {
  if (placement === "tiled") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {Array.from({ length: 20 }, (_, index) => {
          const row = Math.floor(index / 4);
          const column = index % 4;

          return (
            <WatermarkPreviewItem
              key={index}
              color={color}
              fontSize={fontSize}
              imageUrl={imageUrl}
              imageWidthPercent={imageWidthPercent}
              mode={mode}
              opacity={opacity}
              rotation={rotation}
              text={text}
              className="absolute"
              style={{
                left: `${-10 + column * 34}%`,
                top: `${-8 + row * 24}%`,
              }}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={["absolute select-none", placement === "custom" ? "cursor-move touch-none rounded-md ring-2 ring-emerald-500/25" : "pointer-events-none"].join(" ")}
      style={getPreviewPlacementStyle(placement, customPosition)}
      onPointerCancel={onPointerCancel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      role={placement === "custom" ? "button" : undefined}
      tabIndex={placement === "custom" ? 0 : undefined}
      aria-label={placement === "custom" ? "Watermark placement" : undefined}
    >
      <WatermarkPreviewItem color={color} fontSize={fontSize} imageUrl={imageUrl} imageWidthPercent={imageWidthPercent} mode={mode} opacity={opacity} rotation={rotation} text={text} />
    </div>
  );
}

function WatermarkPreviewItem({
  className,
  color,
  fontSize,
  imageUrl,
  imageWidthPercent,
  mode,
  opacity,
  rotation,
  style,
  text,
}: {
  className?: string;
  color: string;
  fontSize: number;
  imageUrl: string | null;
  imageWidthPercent: number;
  mode: WatermarkMode;
  opacity: number;
  rotation: number;
  style?: React.CSSProperties;
  text: string;
}) {
  if (mode === "image" && imageUrl) {
    return (
      <span
        className={className}
        style={{
          ...style,
          display: "block",
          width: `${imageWidthPercent}%`,
          minWidth: 72,
          opacity,
          transform: `rotate(${rotation}deg)`,
          transformOrigin: "center",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="block w-full" src={imageUrl} alt="" draggable={false} />
      </span>
    );
  }

  return (
    <span
      className={["whitespace-nowrap font-black uppercase", className].filter(Boolean).join(" ")}
      style={{
        ...style,
        color,
        fontSize,
        lineHeight: 1,
        opacity,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: "center",
      }}
    >
      {text || "WATERMARK"}
    </span>
  );
}

function getPreviewPlacementStyle(placement: WatermarkPlacement, customPosition: { x: number; y: number }): React.CSSProperties {
  if (placement === "custom") {
    return {
      left: `${customPosition.x * 100}%`,
      top: `${customPosition.y * 100}%`,
    };
  }

  if (placement === "top-left") return { left: "8%", top: "8%" };
  if (placement === "top-right") return { right: "8%", top: "8%" };
  if (placement === "bottom-left") return { left: "8%", bottom: "8%" };
  if (placement === "bottom-right") return { right: "8%", bottom: "8%" };

  return {
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
