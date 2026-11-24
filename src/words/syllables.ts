import { splitWord, toString } from "../engine/tiles";
import type { WordEntry } from "./types";

let syllableTable: readonly string[] = [];

export function setSyllableTable(table: readonly string[]): void {
  syllableTable = table;
}

export function getWordSyllables(word: WordEntry): string[] {
  if (word.s && syllableTable.length > 0) {
    return word.s.map((index) => {
      const syllable = syllableTable[index];
      if (syllable === undefined) throw new Error(`Unknown syllable index ${index} for ${word.w}`);
      return syllable;
    });
  }
  return splitWord(word.w).map(toString);
}

export function getWordSyllableIds(word: WordEntry): number[] | undefined {
  return word.s && syllableTable.length > 0 ? word.s : undefined;
}

export function getSyllableText(index: number): string {
  const syllable = syllableTable[index];
  if (syllable === undefined) throw new Error(`Unknown syllable index ${index}`);
  return syllable;
}

export function getWordSyllableSignature(word: WordEntry): string {
  if (word.s) return [...word.s].sort((first, second) => first - second).join(",");
  return getWordSyllables(word).sort().join("\u0000");
}
