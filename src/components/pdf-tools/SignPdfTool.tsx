"use client";

import { ChangeEvent, MouseEvent, PointerEvent, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Download, FileText, FileSignature, Loader2, ShieldCheck, Trash2, Upload } from "lucide-react";
import { toArrayBuffer } from "@/lib/bytes";
import { addSignatureImage, type ImageInput } from "@/lib/pdf/operations/advanced";
import { renderPdfPageToImage } from "@/lib/pdf/renderPdfToImage";
import { getErrorMessage, NumberField, readImageInputs, TextField, requireActiveDocument } from "./shared";
import { downloadResult, formatBytes, usePdfToolController } from "./shared";
import styles from "./PdfTool.module.css";

type SignaturePlacement = {
  x: number;
  y: number;
  width: number;
};

type SignatureInteraction = "move" | "resize" | null;

export function SignPdfTool() {
  const tool = usePdfToolController();
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const previewPageRef = useRef<HTMLDivElement>(null);
  const pointerOffsetRef = useRef({ x: 0, y: 0 });
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingSignatureRef = useRef(false);
  const drawSignatureHasInkRef = useRef(false);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const [signatureImage, setSignatureImage] = useState<ImageInput | null>(null);
  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState<string | null>(null);
  const [signatureAspectRatio, setSignatureAspectRatio] = useState(3);
  const [signaturePlacement, setSignaturePlacement] = useState<SignaturePlacement>({ x: 0.62, y: 0.72, width: 0.24 });
  const [signatureInteraction, setSignatureInteraction] = useState<SignatureInteraction>(null);
  const [pagePreviewUrl, setPagePreviewUrl] = useState<string | null>(null);
  const [pagePreviewStatus, setPagePreviewStatus] = useState<"idle" | "loading" | "error">("idle");
  const [pagePreviewError, setPagePreviewError] = useState<string | null>(null);
  const [drawSignatureHasInk, setDrawSignatureHasInk] = useState(false);
  const [pdfImagePage, setPdfImagePage] = useState(1);
  const signatureSizePercent = Math.round(signaturePlacement.width * 100);

  useEffect(() => {
    setPdfImagePage(1);
  }, [tool.activeDocument?.id]);

  useEffect(() => {
    prepareSignatureCanvas();

    window.addEventListener("resize", prepareSignatureCanvas);
    return () => window.removeEventListener("resize", prepareSignatureCanvas);
  }, []);

  useEffect(() => {
    if (!signatureImage) {
      setSignaturePreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(new Blob([toArrayBuffer(signatureImage.bytes)], { type: signatureImage.type }));
    setSignaturePreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [signatureImage]);

  useEffect(() => {
    if (!signaturePreviewUrl) return;

    const image = new Image();
    image.onload = () => {
      if (image.naturalWidth > 0 && image.naturalHeight > 0) {
        setSignatureAspectRatio(image.naturalWidth / image.naturalHeight);
      }
    };
    image.src = signaturePreviewUrl;
  }, [signaturePreviewUrl]);

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
      pageIndex: Math.max(0, Math.min(document.pageCount - 1, pdfImagePage - 1)),
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
  }, [tool.activeDocument, pdfImagePage]);

  async function handleSignatureFiles(files: FileList | File[]) {
    try {
      tool.setError(null);
      const [nextImage] = await readImageInputs(files);
      setSignatureImage(nextImage ?? null);
      setSignaturePlacement({ x: 0.62, y: 0.72, width: 0.24 });
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

  function prepareSignatureCanvas() {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const width = Math.max(320, Math.round(rect.width));
    const height = Math.max(144, Math.round(rect.height));
    const ratio = window.devicePixelRatio || 1;
    const existingImage = canvas.toDataURL("image/png");

    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);

    const context = canvas.getContext("2d");
    if (!context) return;

    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 3;
    context.strokeStyle = "#020617";

    if (drawSignatureHasInkRef.current) {
      const image = new Image();
      image.onload = () => context.drawImage(image, 0, 0, width, height);
      image.src = existingImage;
    }
  }

  function getCanvasPoint(event: PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function getCanvasMousePoint(event: MouseEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function startSignatureStroke(canvas: HTMLCanvasElement, point: { x: number; y: number }) {
    const context = canvas.getContext("2d");
    if (!context) return;

    isDrawingSignatureRef.current = true;
    context.beginPath();
    context.moveTo(point.x, point.y);
  }

  function continueSignatureStroke(canvas: HTMLCanvasElement, point: { x: number; y: number }) {
    if (!isDrawingSignatureRef.current) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.lineTo(point.x, point.y);
    context.stroke();
    drawSignatureHasInkRef.current = true;
    setDrawSignatureHasInk(true);
  }

  function finishSignatureStroke() {
    if (!isDrawingSignatureRef.current) return;

    isDrawingSignatureRef.current = false;
    void useDrawnSignature();
  }

  function handleDrawPointerDown(event: PointerEvent<HTMLCanvasElement>) {
    startSignatureStroke(event.currentTarget, getCanvasPoint(event));
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleDrawPointerMove(event: PointerEvent<HTMLCanvasElement>) {
    continueSignatureStroke(event.currentTarget, getCanvasPoint(event));
  }

  function handleDrawPointerUp(event: PointerEvent<HTMLCanvasElement>) {
    finishSignatureStroke();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleDrawMouseDown(event: MouseEvent<HTMLCanvasElement>) {
    if (isDrawingSignatureRef.current) return;
    startSignatureStroke(event.currentTarget, getCanvasMousePoint(event));
  }

  function handleDrawMouseMove(event: MouseEvent<HTMLCanvasElement>) {
    continueSignatureStroke(event.currentTarget, getCanvasMousePoint(event));
  }

  function handleDrawMouseUp() {
    finishSignatureStroke();
  }

  async function useDrawnSignature() {
    const canvas = drawCanvasRef.current;
    if (!canvas || !drawSignatureHasInkRef.current) return;

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) {
      tool.setError("Gagal membuat gambar tanda tangan.");
      return;
    }

    setSignatureImage({
      bytes: new Uint8Array(await blob.arrayBuffer()),
      type: "image/png",
      name: "drawn-signature.png",
    });
    setSignaturePlacement({ x: 0.62, y: 0.72, width: 0.24 });
  }

  function clearDrawnSignature() {
    const canvas = drawCanvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    drawSignatureHasInkRef.current = false;
    setDrawSignatureHasInk(false);
  }

  function updateSignatureSize(sizePercent: number) {
    const nextWidth = clamp(sizePercent / 100, 0.08, 0.62);
    setSignaturePlacement((current) => clampPlacement({ ...current, width: nextWidth }, signatureAspectRatio));
  }

  function getPointerPosition(event: PointerEvent<HTMLElement>) {
    const rect = previewPageRef.current?.getBoundingClientRect();
    if (!rect) return null;

    return {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    };
  }

  function handleSignaturePointerDown(event: PointerEvent<HTMLDivElement>) {
    const pointerPosition = getPointerPosition(event);
    if (!pointerPosition) return;

    pointerOffsetRef.current = {
      x: pointerPosition.x - signaturePlacement.x,
      y: pointerPosition.y - signaturePlacement.y,
    };
    setSignatureInteraction("move");
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleResizePointerDown(event: PointerEvent<HTMLSpanElement>) {
    event.preventDefault();
    event.stopPropagation();
    setSignatureInteraction("resize");
    event.currentTarget.parentElement?.setPointerCapture(event.pointerId);
  }

  function handleSignaturePointerMove(event: PointerEvent<HTMLDivElement>) {
    const pointerPosition = getPointerPosition(event);
    if (!pointerPosition || !signatureInteraction) return;

    if (signatureInteraction === "move") {
      setSignaturePlacement((current) => clampPlacement({
        ...current,
        x: pointerPosition.x - pointerOffsetRef.current.x,
        y: pointerPosition.y - pointerOffsetRef.current.y,
      }, signatureAspectRatio));
      return;
    }

    setSignaturePlacement((current) => clampPlacement({
      ...current,
      width: clamp(pointerPosition.x - current.x, 0.08, 0.62),
    }, signatureAspectRatio));
  }

  function stopSignatureInteraction(event: PointerEvent<HTMLDivElement>) {
    setSignatureInteraction(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
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
                    className={index + 1 === pdfImagePage ? styles.pageChipActive : styles.pageChip}
                    onClick={() => setPdfImagePage(index + 1)}
                  >
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
                    <FileSignature size={22} />
                    <p>{pagePreviewError}</p>
                  </div>
                ) : null}

                {pagePreviewStatus === "idle" && pagePreviewUrl ? (
                  <div ref={previewPageRef} className="relative mx-auto w-fit max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_16px_42px_rgb(15_23_42_/_12%)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="block max-h-[68vh] max-w-full select-none" src={pagePreviewUrl} alt={`Preview page ${pdfImagePage}`} draggable={false} />
                    {signaturePreviewUrl ? (
                      <div
                        className="absolute touch-none select-none rounded-md border border-emerald-500/70 bg-emerald-50/25 shadow-[0_8px_20px_rgb(15_23_42_/_16%)]"
                        style={{
                          left: `${signaturePlacement.x * 100}%`,
                          top: `${signaturePlacement.y * 100}%`,
                          width: `${signaturePlacement.width * 100}%`,
                        }}
                        onPointerDown={handleSignaturePointerDown}
                        onPointerMove={handleSignaturePointerMove}
                        onPointerUp={stopSignatureInteraction}
                        onPointerCancel={stopSignatureInteraction}
                        role="button"
                        tabIndex={0}
                        aria-label="Signature placement"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img className="block w-full pointer-events-none" src={signaturePreviewUrl} alt="" draggable={false} />
                        <span
                          className="absolute -bottom-2 -right-2 size-5 cursor-nwse-resize rounded-full border-2 border-white bg-emerald-600 shadow"
                          onPointerDown={handleResizePointerDown}
                          aria-hidden="true"
                        />
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {pagePreviewStatus === "idle" && pagePreviewUrl && !signaturePreviewUrl ? (
                  <p className="m-0 mt-3 text-center text-sm font-semibold text-slate-600">Upload signature untuk menempatkannya di halaman ini.</p>
                ) : null}
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
            <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-slate-600">Draw signature</span>
                <button className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-extrabold text-slate-700 hover:border-emerald-500/35 hover:bg-emerald-50 disabled:opacity-45" type="button" onClick={clearDrawnSignature} disabled={!drawSignatureHasInk}>
                  Clear
                </button>
              </div>
              <canvas
                ref={drawCanvasRef}
                className="h-36 w-full touch-none rounded-md border border-dashed border-emerald-500/40 bg-white"
                aria-label="Draw signature"
                onPointerDown={handleDrawPointerDown}
                onPointerMove={handleDrawPointerMove}
                onPointerUp={handleDrawPointerUp}
                onPointerCancel={handleDrawPointerUp}
                onMouseDown={handleDrawMouseDown}
                onMouseMove={handleDrawMouseMove}
                onMouseUp={handleDrawMouseUp}
                onMouseLeave={handleDrawMouseUp}
              />
              <span className={styles.helpText}>Tanda tangan langsung di area ini. Hasilnya otomatis dipakai setelah Anda selesai menggambar.</span>
            </div>
            {signaturePreviewUrl ? (
              <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                <div className="grid min-h-20 place-items-center rounded-md border border-dashed border-emerald-500/35 bg-white p-2">
                  <span className="block h-16 w-full bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${signaturePreviewUrl})` }} aria-hidden="true" />
                </div>
                <span className={styles.helpText}>{signatureImage?.name}</span>
              </div>
            ) : (
              <span className={styles.helpText}>Belum ada gambar signature.</span>
            )}
            <span className={styles.helpText}>Drag signature di preview untuk memindahkan posisi. Tarik titik kanan bawah untuk resize.</span>
            <NumberField label="Page" value={pdfImagePage} onChange={setPdfImagePage} min={1} max={Math.max(1, tool.activeDocument?.pageCount ?? 1)} />
            <NumberField label="Size (%)" value={signatureSizePercent} onChange={updateSignatureSize} min={8} max={62} />
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
            <button className={styles.primaryButton} type="button" onClick={() => void tool.handleProcess(() => { const document = requireActiveDocument(tool.activeDocument); if (!signatureImage) throw new Error("Pilih gambar tanda tangan terlebih dahulu."); return addSignatureImage(document.bytes, signatureImage, { pageIndex: Math.max(0, Math.min(document.pageCount - 1, pdfImagePage - 1)), width: 140, xRatio: signaturePlacement.x, yRatio: signaturePlacement.y, widthRatio: signaturePlacement.width }); })} disabled={!(canProcess)}>
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

function clampPlacement(placement: SignaturePlacement, aspectRatio: number): SignaturePlacement {
  const height = placement.width / Math.max(0.1, aspectRatio);

  return {
    width: clamp(placement.width, 0.08, 0.62),
    x: clamp(placement.x, 0, Math.max(0, 1 - placement.width)),
    y: clamp(placement.y, 0, Math.max(0, 1 - height)),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
