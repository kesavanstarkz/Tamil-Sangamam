import type { WordBankData, WordEntry } from "./types";
import { mulberry32, seededSample } from "../engine/random";
import { setSyllableTable } from "./syllables";

let bankPromise: Promise<WordBankData> | undefined;
const filteredWordCache = new Map<string, WordEntry[]>();

async function loadBank(): Promise<WordBankData> {
  if (!bankPromise) {
    bankPromise = Promise.resolve().then(() => {
        const bank = require("../../assets/words/wordbank.json") as WordBankData;
        setSyllableTable(bank.syllables);
        return bank;
      });
  }
  return bankPromise;
}

export async function getWords(options: {
  tier?: "A" | "B" | "all";
  minD?: number;
  maxD?: number;
  n?: number;
  count?: number;
  seed?: number;
} = {}): Promise<WordEntry[]> {
  const bank = await loadBank();
  const { tier = "all", minD = 1, maxD = 5, n, count, seed = 0 } = options;
  const cacheKey = `${tier}:${minD}:${maxD}:${n ?? "*"}`;
  let candidates = filteredWordCache.get(cacheKey);
  if (!candidates) {
    const indexes = Array.from({ length: Math.max(0, maxD - minD + 1) }, (_, index) =>
      bank.byDifficulty[String(minD + index)] ?? [],
    ).flat();
    candidates = indexes.map((index) => bank.words[index]).filter(
      (word) =>
        (tier === "all" || word.t === tier) &&
        word.d >= minD &&
        word.d <= maxD &&
        (n === undefined || word.n === n),
    );
    filteredWordCache.set(cacheKey, candidates);
  }
  return count === undefined
    ? candidates
    : seededSample(candidates, count, mulberry32(seed));
}

export async function getWordBank(): Promise<WordBankData> {
  return loadBank();
}

export type { WordBankData, WordEntry };
