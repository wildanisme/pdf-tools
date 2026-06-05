import { describe, expect, it } from "vitest";
import { parsePageRanges } from "@/lib/pdf/pageRanges";

describe("parsePageRanges", () => {
  it("parses comma-separated pages and ranges into zero-based page indexes", () => {
    expect(parsePageRanges("1-3,5,8-10", 12)).toEqual({
      ok: true,
      pageIndexes: [0, 1, 2, 4, 7, 8, 9],
    });
  });

  it("deduplicates repeated pages while keeping input order", () => {
    expect(parsePageRanges("2,1-3,2", 4)).toEqual({
      ok: true,
      pageIndexes: [1, 0, 2],
    });
  });

  it("rejects descending ranges", () => {
    expect(parsePageRanges("5-2", 6)).toEqual({
      ok: false,
      error: "Rentang \"5-2\" harus naik, bukan turun.",
    });
  });

  it("rejects pages beyond the document length", () => {
    expect(parsePageRanges("1,6", 5)).toEqual({
      ok: false,
      error: "Halaman 6 melebihi jumlah halaman PDF (5).",
    });
  });
});
