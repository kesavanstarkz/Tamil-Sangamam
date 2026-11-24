import { performance } from "node:perf_hooks";
import {
  createMissingLetterPuzzle,
  createAntaadhiState,
  createUnscramblePuzzle,
  createWordSearchPuzzle,
  parseTile,
  tileKey,
  toString,
} from "./index";
import type { WordEntry } from "../words/types";
import { setSyllableTable } from "../words/syllables";
import { NATIVE_MEIS, VOWEL_SIGNS } from "./tamil";

const syllableTable = NATIVE_MEIS.flatMap((base) =>
  VOWEL_SIGNS.map((sign) => toString(parseTile(`${base}${sign}`))),
);
setSyllableTable(syllableTable);
const largeBank: WordEntry[] = Array.from({ length: 20_000 }, (_, index) => {
  const first = Math.floor(index / 100);
  const second = index % 100;
  const third = (first + second) % syllableTable.length;
  const ids = [first, second, third];
  return {
    w: ids.map((id) => syllableTable[id]).join(""),
    n: 3,
    f: index + 1,
    d: 1,
    t: "A",
    k: tileKey(parseTile(syllableTable[first])),
    e: tileKey(parseTile(syllableTable[third])),
    s: ids,
  };
});
const firstSyllableIndex: Record<string, number[]> = {};
largeBank.forEach((word, index) => { (firstSyllableIndex[word.k] ??= []).push(index); });
const chainStart = largeBank.find(
  (word) => word.e !== null && (firstSyllableIndex[word.e]?.length ?? 0) >= 4,
);
if (!chainStart) throw new Error("Performance fixture needs a valid Antaadhi start");

describe("puzzle generation budget", () => {
  test.each([
    ["missing-letter", () => createMissingLetterPuzzle(largeBank, 124)],
    ["unscramble", () => createUnscramblePuzzle(largeBank, 124)],
    ["word-search", () => createWordSearchPuzzle(largeBank, 1, 124)],
    ["antaadhi", () => createAntaadhiState(largeBank, chainStart.w, firstSyllableIndex)],
  ])("%s generation stays under 50ms for a 20k-entry bank", (_mode, generate) => {
    const started = performance.now();
    generate();
    expect(performance.now() - started).toBeLessThan(50);
  });
});
