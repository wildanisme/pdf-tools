"use client";

import { Download, FileArchive, ShieldCheck, Trash2 } from "lucide-react";
import { downloadBytes } from "@/lib/download";
import { formatBytes, usePdfToolController } from "./shared";
import styles from "./PdfTool.module.css";

export function LocalHistoryTool() {
  const tool = usePdfToolController();
  return (
    <main className={styles.workspace}>
      <header className={styles.header}>
        <div className={styles.brandGroup}>
          <div className={styles.brandMark} aria-hidden="true"><span /></div>
          <div>
            <p className={styles.eyebrow}>Client-side PDF tool</p>
            <h1>Local History</h1>
            <p className={styles.headerDescription}>Lihat hasil terakhir yang tersimpan lokal di IndexedDB.</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.privacyPill}>
            <ShieldCheck size={18} />
            <span>File tetap di perangkat Anda</span>
          </div>
        </div>
      </header>
      <section className={styles.toolWorkbench} aria-label="Local history workspace">
        <div className={styles.primaryColumn}>
          <section className={styles.documentPanel} aria-label="Local history records">
            <div className={styles.fileListHeader}><span>History</span><span>{tool.history.length} item</span></div>
            <div className={styles.historyList}>
              {tool.history.length === 0 ? <p>Belum ada hasil lokal.</p> : null}
              {tool.history.map((item) => <button key={item.id} type="button" className={styles.historyItem} onClick={() => downloadBytes(item.bytes, item.fileName, item.mimeType)}><strong>{item.fileName}</strong><span>{formatBytes(item.bytes.byteLength)} · {new Date(item.createdAt).toLocaleString("id-ID")}</span></button>)}
            </div>
          </section>
        </div>
        <aside className={styles.actionPanel} aria-label="History options">
          <div className={styles.sectionHeader}><span>Local History</span><FileArchive size={16} /></div>
          <div className={styles.optionStack}>
            <div className={styles.optionBlock}><h2>Riwayat perangkat ini</h2><p>Semua item berasal dari IndexedDB lokal browser Anda.</p></div>
            <button className={styles.secondaryButton} type="button" disabled={tool.history.length === 0} onClick={() => void tool.clearHistory()}><Trash2 size={18} /> Bersihkan history</button>
            <button className={styles.secondaryButton} type="button" disabled={tool.history.length === 0} onClick={() => { const [first] = tool.history; if (first) downloadBytes(first.bytes, first.fileName, first.mimeType); }}><Download size={18} /> Download terbaru</button>
          </div>
        </aside>
      </section>
    </main>
  );
}
