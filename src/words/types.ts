export interface WordEntry {
  w: string;
  n: number;
  f: number;
  d: number;
  t: "A" | "B";
  k: string;
  e: string | null;
  s?: number[];
}

export interface WordBankData {
  words: WordEntry[];
  byDifficulty: Record<string, number[]>;
  byFirstSyllable: Record<string, number[]>;
  syllables: string[];
}
