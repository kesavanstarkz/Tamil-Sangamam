import { parseTile, tileKey, toString } from "./tiles";
import { seededSample, seededShuffle } from "./random";
import type { WordEntry } from "../words/types";
import { getWordSyllables } from "../words/syllables";

export interface MissingLetterPuzzle {
  word: string;
  tiles: string[];
  hiddenIndex: number;
  options: string[];
  answer: string;
}

export interface MissingLetterState extends MissingLetterPuzzle {
  selected: string | null;
  solved: boolean;
  wrong?: string[];
  mistakes?: number;
}

export type MissingLetterAction = { type: "choose"; syllable: string } | { type: "reset" };

const preparedDictionary = new WeakMap<readonly WordEntry[], Set<string>>();

const SHORT_VOWELS = [0, 2, 4, 6, 9];
const LONG_VOWELS = [1, 3, 5, 7, 10];
const VOWEL_PAIRS = [[0, 1], [2, 3], [4, 5], [6, 7], [9, 10]];
const CONFUSABLES = [["ல", "ள", "ழ"], ["ன", "ண", "ந"], ["ர", "ற"]];
const MEI_GROUPS = [
  ["க", "ச", "ட", "த", "ப", "ற"],
  ["ங", "ஞ", "ண", "ந", "ம", "ன"],
  ["ய", "ர", "ல", "வ", "ழ", "ள"],
];

export function getSimilarSyllables(value: string): string[] {
  const tile = parseTile(value);
  const variants = new Map<string, ReturnType<typeof parseTile>>();
  function add(candidate: ReturnType<typeof parseTile>) {
    const key = tileKey(candidate);
    if (key !== tileKey(tile)) variants.set(key, candidate);
  }
  if (tile.kind === "uyir") {
    const short = SHORT_VOWELS.includes(tile.id);
    (short ? SHORT_VOWELS : LONG_VOWELS).forEach((id) => add(parseTile(["அ", "ஆ", "இ", "ஈ", "உ", "ஊ", "எ", "ஏ", "ஐ", "ஒ", "ஓ", "ஔ"][id])));
  } else {
    const group = MEI_GROUPS.find((letters) => letters.includes(tile.base)) ?? [];
    const related = new Set([
      ...group,
      ...(CONFUSABLES.find((letters) => letters.includes(tile.base)) ?? []),
    ]);
    related.delete(tile.base);
    related.forEach((base) => add(
      tile.kind === "mei" ? { kind: "mei", base } : { kind: "uyirmei", base, uyirId: tile.uyirId },
    ));
    if (tile.kind === "uyirmei") {
      const relatedVowels = VOWEL_PAIRS.find((pair) => pair.includes(tile.uyirId)) ?? [];
      relatedVowels.filter((id) => id !== tile.uyirId).forEach((uyirId) => {
        add({ kind: "uyirmei", base: tile.base, uyirId });
        related.forEach((base) => add({ kind: "uyirmei", base, uyirId }));
      });
    }
  }
  return [...variants.values()].map(toString);
}

export function createMissingLetterPuzzle(
  words: readonly WordEntry[],
  seed: number,
): MissingLetterPuzzle {
  let state = seed >>> 0;
  const random = () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  let dictionary = preparedDictionary.get(words);
  if (!dictionary) {
    dictionary = new Set(words.map((entry) => entry.w));
    preparedDictionary.set(words, dictionary);
  }
  const candidates = seededSample(words, Math.min(80, words.length), random);
  for (const word of candidates) {
    if (word.n < 2 || word.n > 6) continue;
    const tiles = getWordSyllables(word);
    if (tiles.length !== word.n) continue;
    const hiddenIndex = Math.floor(random() * tiles.length);
    const answer = tiles[hiddenIndex];
    const alternatives = getSimilarSyllables(answer)
      .filter((syllable) => {
        const completed = [...tiles];
        completed[hiddenIndex] = syllable;
        return !dictionary.has(completed.join(""));
      });
    const distractors = seededShuffle(alternatives, random).slice(0, 3);
    if (distractors.length === 3) {
      return {
        word: word.w,
        tiles,
        hiddenIndex,
        options: seededShuffle([answer, ...distractors], random),
        answer,
      };
    }
  }
  throw new Error("Unable to generate a uniquely solvable missing-letter puzzle");
}

export function missingLetterReducer(
  state: MissingLetterState,
  action: MissingLetterAction,
): MissingLetterState {
  if (action.type === "reset") return { ...state, selected: null, solved: false, wrong: [], mistakes: 0 };
  if (!state.options.includes(action.syllable) || state.solved) return state;
  if (action.syllable !== state.answer) {
    return {
      ...state,
      selected: null,
      wrong: [...(state.wrong ?? []), action.syllable],
      mistakes: (state.mistakes ?? 0) + 1,
    };
  }
  return { ...state, selected: action.syllable, wrong: state.wrong ?? [], solved: true };
}
