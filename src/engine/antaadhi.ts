import { splitWord, toString } from "./tiles";
import type { WordEntry } from "../words/types";

export interface AntaadhiState {
  chain: string[];
  score: number;
  bestScore: number;
  followers: Record<string, number[]>;
  words: WordEntry[];
  solved: boolean;
}

export type AntaadhiAction =
  | { type: "choose"; word: string }
  | { type: "reset"; start: string }
  | { type: "continue" };

export function createAntaadhiState(
  words: WordEntry[],
  start: string,
  firstSyllableIndex?: Record<string, number[]>,
): AntaadhiState {
  const followers: Record<string, number[]> = {};
  if (firstSyllableIndex) {
    Object.assign(followers, firstSyllableIndex);
  } else {
    words.forEach((word, index) => {
      (followers[word.k] ??= []).push(index);
    });
  }
  const starters = words.filter((word) => word.e !== null && (followers[word.e]?.length ?? 0) >= 4);
  if (!starters.some((word) => word.w === start)) {
    throw new Error("Antaadhi start must have at least four followers and a syllabic ending");
  }
  return { chain: [start], score: 0, bestScore: 0, followers, words, solved: false };
}

export function antaadhiReducer(state: AntaadhiState, action: AntaadhiAction): AntaadhiState {
  if (action.type === "continue") return { ...state, solved: false };
  if (action.type === "reset") {
    return {
      ...createAntaadhiState(state.words, action.start, state.followers),
      bestScore: Math.max(state.bestScore, state.score),
    };
  }
  if (state.solved) return state;
  const previous = state.chain[state.chain.length - 1];
  const previousEntry = state.words.find((word) => word.w === previous);
  const candidate = state.words.find((word) => word.w === action.word);
  if (
    !previousEntry ||
    !candidate ||
    state.chain.includes(candidate.w) ||
    previousEntry.e === null ||
    candidate.k !== previousEntry.e
  ) return state;
  const score = state.score + 1;
  return {
    ...state,
    chain: [...state.chain, candidate.w],
    score,
    bestScore: Math.max(state.bestScore, score),
    solved: true,
  };
}

export function getAntaadhiFollowers(
  words: WordEntry[],
  word: string,
  firstSyllableIndex?: Record<string, number[]>,
): string[] {
  const current = words.find((entry) => entry.w === word);
  if (!current || current.e === null) return [];
  const indices = firstSyllableIndex?.[current.e];
  if (indices) return indices.map((index) => words[index]).filter((entry) => entry !== undefined).map((entry) => entry.w);
  return words.filter((entry) => entry.k === current.e).map((entry) => entry.w);
}

export function syllableKeys(word: string): string[] {
  return splitWord(word).map((tile) => toString(tile));
}
