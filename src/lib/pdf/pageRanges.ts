export type PageRangeParseResult =
  | {
      ok: true;
      pageIndexes: number[];
    }
  | {
      ok: false;
      error: string;
    };

export function parsePageRanges(input: string, totalPages: number): PageRangeParseResult {
  const trimmed = input.trim();

  if (!Number.isInteger(totalPages) || totalPages < 1) {
    return { ok: false, error: "PDF belum memiliki halaman yang valid." };
  }

  if (trimmed.length === 0) {
    return { ok: false, error: "Masukkan nomor halaman, misalnya 1-3,5." };
  }

  const pages: number[] = [];
  const seen = new Set<number>();
  const parts = trimmed.split(",");

  for (const rawPart of parts) {
    const part = rawPart.trim();

    if (part.length === 0) {
      return { ok: false, error: "Format rentang halaman tidak valid." };
    }

    const rangeMatch = part.match(/^(\d+)(?:-(\d+))?$/);

    if (!rangeMatch) {
      return { ok: false, error: `Rentang "${part}" tidak valid.` };
    }

    const start = Number(rangeMatch[1]);
    const end = rangeMatch[2] ? Number(rangeMatch[2]) : start;

    if (start < 1 || end < 1) {
      return { ok: false, error: "Nomor halaman dimulai dari 1." };
    }

    if (start > end) {
      return { ok: false, error: `Rentang "${part}" harus naik, bukan turun.` };
    }

    if (end > totalPages) {
      return {
        ok: false,
        error: `Halaman ${end} melebihi jumlah halaman PDF (${totalPages}).`,
      };
    }

    for (let page = start; page <= end; page += 1) {
      const pageIndex = page - 1;

      if (!seen.has(pageIndex)) {
        seen.add(pageIndex);
        pages.push(pageIndex);
      }
    }
  }

  return { ok: true, pageIndexes: pages };
}
