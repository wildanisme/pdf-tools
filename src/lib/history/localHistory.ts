import type { PdfProcessingResult } from "@/lib/pdf/types";

const DB_NAME = "privacy-pdf-tools";
const STORE_NAME = "results";
const DB_VERSION = 1;

export type HistoryRecord = {
  id: string;
  fileName: string;
  bytes: Uint8Array;
  mimeType: string;
  createdAt: number;
  pageCount: number;
};

export async function saveHistoryRecord(result: PdfProcessingResult): Promise<HistoryRecord> {
  const db = await openHistoryDb();
  const record: HistoryRecord = {
    id: crypto.randomUUID(),
    fileName: result.fileName,
    bytes: result.bytes,
    mimeType: result.mimeType ?? "application/pdf",
    createdAt: Date.now(),
    pageCount: result.pageCount,
  };

  await requestToPromise(db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).put(record));
  db.close();
  return record;
}

export async function listHistoryRecords(): Promise<HistoryRecord[]> {
  const db = await openHistoryDb();
  const records = await requestToPromise<HistoryRecord[]>(
    db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll(),
  );
  db.close();
  return records.sort((a, b) => b.createdAt - a.createdAt);
}

export async function clearHistoryRecords(): Promise<void> {
  const db = await openHistoryDb();
  await requestToPromise(db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).clear());
  db.close();
}

function openHistoryDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
