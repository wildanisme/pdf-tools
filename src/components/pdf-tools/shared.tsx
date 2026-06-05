"use client";

import { useEffect, useMemo, useState } from "react";
import { toArrayBuffer } from "@/lib/bytes";
import { downloadBytes } from "@/lib/download";
import { validatePdfFile } from "@/lib/files/validateFile";
import { clearHistoryRecords, listHistoryRecords, saveHistoryRecord, type HistoryRecord } from "@/lib/history/localHistory";
import { getPdfPageCount, loadPdfDocument } from "@/lib/pdf/loadDocument";
import { parsePageRanges } from "@/lib/pdf/pageRanges";
import type { ImageInput } from "@/lib/pdf/operations/advanced";
import type { PdfDocumentState, PdfProcessingResult, PdfProcessingStatus } from "@/lib/pdf/types";
import styles from "./PdfTool.module.css";

export function usePdfToolController() {
  const [documents, setDocuments] = useState<PdfDocumentState[]>([]);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [status, setStatus] = useState<PdfProcessingStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PdfProcessingResult | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [outputName, setOutputName] = useState("");

  const activeDocument = useMemo(
    () => documents.find((document) => document.id === activeDocumentId) ?? documents[0] ?? null,
    [activeDocumentId, documents],
  );
  const activeDocumentUrl = useObjectUrl(activeDocument?.bytes ?? null, "application/pdf");

  useEffect(() => {
    void refreshHistory();
  }, []);

  async function refreshHistory() {
    if (typeof indexedDB === "undefined") return;
    setHistory(await listHistoryRecords());
  }

  async function handlePdfFiles(files: FileList | File[]) {
    setError(null);
    setResult(null);
    setStatus("loading");

    try {
      const loadedDocuments: PdfDocumentState[] = [];

      for (const file of Array.from(files)) {
        const validation = validatePdfFile(file);

        if (!validation.ok) {
          throw new Error(`${file.name}: ${validation.error}`);
        }

        loadedDocuments.push(await loadPdfDocument(file));
      }

      setDocuments((current) => {
        const next = [...current, ...loadedDocuments];
        if (!activeDocumentId && next[0]) setActiveDocumentId(next[0].id);
        return next;
      });
      setStatus("idle");
    } catch (caughtError) {
      setStatus("error");
      setError(getErrorMessage(caughtError, "Gagal membaca PDF."));
    }
  }

  async function handleProcess(producer: () => Promise<PdfProcessingResult>) {
    setError(null);
    setResult(null);
    setStatus("processing");

    try {
      const processed = await producer();
      const namedResult = outputName.trim() && processed.mimeType !== "image/png" && processed.mimeType !== "image/jpeg"
        ? { ...processed, fileName: processed.mimeType === "application/zip" ? ensureZipName(outputName.trim()) : ensurePdfName(outputName.trim()) }
        : processed;

      setResult(namedResult);
      setStatus("success");

      if (typeof indexedDB !== "undefined") {
        await saveHistoryRecord(namedResult);
        await refreshHistory();
      }
    } catch (caughtError) {
      setStatus("error");
      setError(getErrorMessage(caughtError, "Proses gagal."));
    }
  }

  async function addResultToFiles() {
    if (!result || (result.mimeType !== undefined && result.mimeType !== "application/pdf")) return;

    const pageCount = await getPdfPageCount(result.bytes);
    const nextDocument: PdfDocumentState = {
      id: crypto.randomUUID(),
      name: result.fileName,
      size: result.bytes.byteLength,
      bytes: result.bytes,
      pageCount,
      createdAt: Date.now(),
    };

    setDocuments((current) => [...current, nextDocument]);
    setActiveDocumentId(nextDocument.id);
  }

  function moveDocument(documentId: string, direction: -1 | 1) {
    setDocuments((current) => {
      const index = current.findIndex((document) => document.id === documentId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
  }

  function removeDocument(documentId: string) {
    setDocuments((current) => current.filter((document) => document.id !== documentId));
    if (activeDocumentId === documentId) setActiveDocumentId(null);
  }

  async function clearHistory() {
    await clearHistoryRecords();
    await refreshHistory();
  }

  return {
    documents,
    setDocuments,
    activeDocument,
    activeDocumentUrl,
    setActiveDocumentId,
    status,
    error,
    setError,
    result,
    history,
    outputName,
    setOutputName,
    handlePdfFiles,
    handleProcess,
    addResultToFiles,
    moveDocument,
    removeDocument,
    clearHistory,
  };
}

export async function readImageInputs(files: FileList | File[]): Promise<ImageInput[]> {
  const nextImages: ImageInput[] = [];

  for (const file of Array.from(files)) {
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      throw new Error(`${file.name}: gunakan PNG, JPEG, atau WebP.`);
    }

    nextImages.push({
      bytes: new Uint8Array(await file.arrayBuffer()),
      type: file.type as ImageInput["type"],
      name: file.name,
    });
  }

  return nextImages;
}

export function PageRangeField({ value, onChange, totalPages }: { value: string; onChange: (value: string) => void; totalPages: number }) {
  return (
    <TextField
      label="Page range"
      value={value}
      onChange={onChange}
      placeholder="1-3,5"
      help={totalPages > 0 ? `PDF aktif memiliki ${totalPages} halaman.` : "Pilih PDF terlebih dahulu."}
    />
  );
}

export function InfoBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className={styles.optionBlock}>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  help,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  help?: string;
}) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <input className={styles.textInput} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      {help ? <small>{help}</small> : null}
    </label>
  );
}

export function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  help,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  help?: string;
}) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <textarea className={styles.textarea} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      {help ? <small>{help}</small> : null}
    </label>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <input
        className={styles.textInput}
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <select className={styles.textInput} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([optionValue, labelText]) => (
          <option key={optionValue} value={optionValue}>
            {labelText}
          </option>
        ))}
      </select>
    </label>
  );
}

export function downloadResult(result: PdfProcessingResult | null) {
  if (!result) return;
  downloadBytes(result.bytes, result.fileName, result.mimeType);
}

export function parsePages(input: string, totalPages: number) {
  const parsed = parsePageRanges(input, totalPages);
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.pageIndexes;
}

export function parseKeyValueLines(input: string): Record<string, string> {
  return Object.fromEntries(
    input
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const separatorIndex = line.indexOf("=");
        if (separatorIndex === -1) return [line, ""];
        return [line.slice(0, separatorIndex).trim(), line.slice(separatorIndex + 1).trim()];
      }),
  );
}

export function requireActiveDocument(document: PdfDocumentState | null): PdfDocumentState {
  if (!document) throw new Error("Pilih PDF terlebih dahulu.");
  return document;
}

export function ensurePdfName(name: string) {
  return name.toLowerCase().endsWith(".pdf") ? name : `${name}.pdf`;
}

export function ensureZipName(name: string) {
  return name.toLowerCase().endsWith(".zip") ? name : `${name}.zip`;
}

export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function useObjectUrl(bytes: Uint8Array | null, type: string) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!bytes) {
      setUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(new Blob([toArrayBuffer(bytes)], { type }));
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [bytes, type]);

  return url;
}
