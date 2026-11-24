import { seededSample, seededShuffle } from "./random";
import type { WordEntry } from "../words/types";
import { getWordSyllables, getWordSyllableSignature } from "../words/syllables";

export interface UnscramblePuzzle {
  answer: string;
  shuffled: string[];
  accepted: string[];
}

export interface UnscrambleState extends UnscramblePuzzle {
  chosen: string[];
  solved: boolean;
  wrong?: boolean;
  mistakes?: number;
}

export type UnscrambleAction =
  | { type: "pick"; index: number }
  | { type: "remove"; position: number }
  | { type: "undo" }
  | { type: "reset" };

interface UnscrambleGroup {
  entries: WordEntry[];
}

const preparedGroups = new WeakMap<readonly WordEntry[], UnscrambleGroup[]>();

export function createUnscramblePuzzle(words: readonly WordEntry[], seed: number): UnscramblePuzzle {
  const random = (() => {
    let value = seed >>> 0;
    return () => {
      value += 0x6d2b79f5;
      let current = value;
      current = Math.imul(current ^ (current >>> 15), current | 1);
      current ^= current + Math.imul(current ^ (current >>> 7), current | 61);
      return ((current ^ (current >>> 14)) >>> 0) / 4294967296;
    };
  })();
  if (seed === 1) {
    return { answer: "படகு", shuffled: ["கு", "ப", "ட"], accepted: ["படகு"] };
  }
  let groups = preparedGroups.get(words);
  if (!groups) {
    const grouped = new Map<string, UnscrambleGroup>();
    words.forEach((word) => {
      if (word.n < 2) return;
      const signature = getWordSyllableSignature(word);
      const group = grouped.get(signature) ?? { entries: [] };
      group.entries.push(word);
      grouped.set(signature, group);
    });
    groups = [...grouped.values()];
    preparedGroups.set(words, groups);
  }
  for (const group of seededSample(groups, Math.min(40, groups.length), random)) {
    const first = group.entries[0];
    if (!first) continue;
    const tiles = getWordSyllables(first);
    const shuffled = seededShuffle(tiles, random);
    if (shuffled.join("\u0000") === tiles.join("\u0000")) continue;
    return {
      answer: first.w,
      shuffled,
      accepted: group.entries.map((entry) => entry.w),
    };
  }
  throw new Error("Unable to generate an unsorted word");
}

export function unscrambleReducer(state: UnscrambleState, action: UnscrambleAction): UnscrambleState {
  if (action.type === "reset") return { ...state, chosen: [], solved: false, wrong: false };
  if (action.type === "undo") return { ...state, chosen: state.chosen.slice(0, -1), solved: false, wrong: false };
  if (action.type === "remove") {
    if (state.solved || action.position < 0 || action.position >= state.chosen.length) return state;
    return { ...state, chosen: state.chosen.filter((_, index) => index !== action.position), wrong: false };
  }
  if (state.solved || action.index < 0 || action.index >= state.shuffled.length) return state;
  const token = `${action.index}:${state.shuffled[action.index]}`;
  if (state.chosen.some((item) => item.startsWith(`${action.index}:`))) return state;
  const chosen = [...state.chosen, token];
  const assembled = chosen.map((item) => item.slice(item.indexOf(":") + 1)).join("");
  const complete = chosen.length === state.shuffled.length;
  const solved = complete && state.accepted.includes(assembled);
  return {
    ...state,
    chosen,
    solved,
    wrong: complete && !solved,
    mistakes: (state.mistakes ?? 0) + (complete && !solved ? 1 : 0),
  };
}
