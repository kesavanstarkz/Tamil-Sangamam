import { seededSample, seededShuffle } from "./random";
import type { WordEntry } from "../words/types";
import { getSyllableText, getWordSyllableIds, getWordSyllables } from "../words/syllables";

type SearchCell = number | string;

export interface WordSearchPuzzle {
  size: number;
  grid: string[][];
  keys: SearchCell[][];
  words: string[];
  paths: number[][];
}

export interface WordSearchState {
  puzzle: WordSearchPuzzle;
  selection: number[];
  found: number[][];
  solved: boolean;
}

export type WordSearchAction =
  | { type: "start"; cell: number }
  | { type: "extend"; cell: number }
  | { type: "release" }
  | { type: "clear" };

const DIRECTIONS = [[0, 1], [1, 0], [1, 1]] as const;

interface SearchWord {
  word: string;
  ids?: number[];
  tiles?: string[];
  frequency: number;
}

interface PreparedSearchWords {
  validWords: SearchWord[];
  byWord: Map<string, SearchWord>;
  byLength: Map<number, Map<string, string[]>>;
  weightedFiller: { cell: SearchCell; cumulativeWeight: number }[];
  totalWeight: number;
}

const preparedWordCache = new WeakMap<readonly WordEntry[], PreparedSearchWords>();

function cellsForWord(entry: SearchWord): readonly SearchCell[] {
  return entry.ids ?? entry.tiles ?? [];
}

function sequenceKey(cells: readonly SearchCell[]): string {
  return typeof cells[0] === "number"
    ? `i:${cells.join(",")}`
    : `t:${cells.join("\u0000")}`;
}

function displayCell(cell: SearchCell): string {
  return typeof cell === "number" ? getSyllableText(cell) : cell;
}

function findPath(grid: (SearchCell | null)[][], entry: SearchWord): number[] | null {
  const size = grid.length;
  const cells = cellsForWord(entry);
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      for (const [dr, dc] of DIRECTIONS) {
        const path: number[] = [];
        let matches = true;
        for (let index = 0; index < cells.length; index += 1) {
          const nextRow = row + dr * index;
          const nextCol = col + dc * index;
          if (nextRow >= size || nextCol >= size || grid[nextRow][nextCol] !== cells[index]) {
            matches = false;
            break;
          }
          path.push(nextRow * size + nextCol);
        }
        if (matches) return path;
      }
    }
  }
  return null;
}

function findAllGridWords(
  grid: (SearchCell | null)[][],
  byLength: Map<number, Map<string, string[]>>,
): Set<string> {
  const size = grid.length;
  const found = new Set<string>();
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      for (const [dr, dc] of DIRECTIONS) {
        const cells: SearchCell[] = [];
        for (
          let length = 1;
          row + dr * (length - 1) < size && col + dc * (length - 1) < size;
          length += 1
        ) {
          const cell = grid[row + dr * (length - 1)][col + dc * (length - 1)];
          if (cell === null) break;
          cells.push(cell);
          byLength.get(length)?.get(sequenceKey(cells))?.forEach((word) => found.add(word));
        }
      }
    }
  }
  return found;
}

function prepareWords(words: readonly WordEntry[]): PreparedSearchWords {
  const cached = preparedWordCache.get(words);
  if (cached) return cached;
  const validWords: SearchWord[] = [];
  const byWord = new Map<string, SearchWord>();
  const byLength = new Map<number, Map<string, string[]>>();
  const fillerWeights = new Map<SearchCell, number>();
  for (const word of words) {
    if (validWords.length >= 500) break;
    const ids = getWordSyllableIds(word);
    const tiles = ids ? undefined : getWordSyllables(word);
    const entry = { word: word.w, ids, tiles, frequency: word.f };
    const cells = cellsForWord(entry);
    if (cells.length === 0) continue;
    validWords.push(entry);
    byWord.set(entry.word, entry);
    let dictionary = byLength.get(cells.length);
    if (!dictionary) {
      dictionary = new Map();
      byLength.set(cells.length, dictionary);
    }
    const key = sequenceKey(cells);
    const matches = dictionary.get(key) ?? [];
    matches.push(entry.word);
    dictionary.set(key, matches);
    const weight = 1 / Math.max(1, entry.frequency);
    cells.forEach((cell) => fillerWeights.set(cell, (fillerWeights.get(cell) ?? 0) + weight));
  }
  let totalWeight = 0;
  const weightedFiller = [...fillerWeights].map(([cell, weight]) => {
    totalWeight += weight;
    return { cell, cumulativeWeight: totalWeight };
  });
  const prepared = { validWords, byWord, byLength, weightedFiller, totalWeight };
  preparedWordCache.set(words, prepared);
  return prepared;
}

export function findWordSearchMatches(puzzle: WordSearchPuzzle, words: readonly WordEntry[]): Set<string> {
  return findAllGridWords(puzzle.keys, prepareWords(words).byLength);
}

export function createWordSearchPuzzle(words: readonly WordEntry[], stage: number, seed: number): WordSearchPuzzle {
  const size = Math.min(8, 5 + Math.floor(Math.max(0, stage - 1) / 5));
  const count = Math.min(8, 3 + Math.floor(Math.max(0, stage - 1) / 5));
  const random = (() => {
    let state = seed >>> 0;
    return () => {
      state += 0x6d2b79f5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  })();
  const prepared = prepareWords(words);
  const validWords = prepared.validWords.filter((word) => cellsForWord(word).length <= size);
  if (validWords.length < count) throw new Error("Not enough words for this word-search stage");

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const chosen = seededSample(validWords, count, random);
    const grid = Array.from({ length: size }, () => Array<string>(size).fill(""));
    const keys = Array.from({ length: size }, () => Array<SearchCell | null>(size).fill(null));
    const paths: number[][] = [];
    let placed = true;
    for (const entry of chosen) {
      const placements = seededShuffle(
        Array.from({ length: size * size }, (_, i) => i)
          .flatMap((origin) => DIRECTIONS.map(([dr, dc]) => ({ origin, dr, dc }))),
        random,
      );
      let found: number[] | null = null;
      for (const { origin, dr, dc } of placements) {
        const row = Math.floor(origin / size);
        const col = origin % size;
        const wordCells = cellsForWord(entry);
        const cells = wordCells.map((_, index) => [row + dr * index, col + dc * index] as const);
        if (cells.some(
          ([r, c], index) =>
            r >= size || c >= size || (keys[r][c] !== null && keys[r][c] !== wordCells[index]),
        )) continue;
        cells.forEach(([r, c], index) => {
          const key = wordCells[index];
          keys[r][c] = key;
          grid[r][c] = displayCell(key);
        });
        found = cells.map(([r, c]) => r * size + c);
        break;
      }
      if (!found) { placed = false; break; }
      paths.push(found);
    }
    if (!placed) continue;

    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        if (keys[row][col] === null) {
          const targetWeight = random() * prepared.totalWeight;
          let low = 0;
          let high = prepared.weightedFiller.length - 1;
          while (low < high) {
            const middle = Math.floor((low + high) / 2);
            if (prepared.weightedFiller[middle].cumulativeWeight < targetWeight) low = middle + 1;
            else high = middle;
          }
          const key = prepared.weightedFiller[low].cell;
          keys[row][col] = key;
          grid[row][col] = displayCell(key);
        }
      }
    }
    const completeKeys = keys.map((row) => row.map((cell) => {
      if (cell === null) throw new Error("Generated word-search grid has an empty cell");
      return cell;
    }));
    const selectedWords = chosen.map((entry) => entry.word);
    const accidental = findAllGridWords(completeKeys, prepared.byLength);
    const listed = [...new Set([...selectedWords, ...accidental])];
    const listedPaths = listed.map((word) => {
      const entry = prepared.byWord.get(word);
      const path = entry ? findPath(completeKeys, entry) : null;
      if (!path) throw new Error(`Generated word is not findable: ${word}`);
      return path;
    });
    return { size, grid, keys: completeKeys, words: listed, paths: listedPaths };
  }
  throw new Error("Unable to place word-search words in grid");
}

export function isWordSearchSolved(puzzle: WordSearchPuzzle, selections: number[][]): boolean {
  const found = new Set(selections.map((path) => path.join(",")));
  return puzzle.paths.every((path) => found.has(path.join(",")));
}

export function wordSearchReducer(state: WordSearchState, action: WordSearchAction): WordSearchState {
  if (action.type === "clear") return { ...state, selection: [] };
  if (action.type === "start") return { ...state, selection: [action.cell] };
  if (action.type === "extend") {
    if (state.selection.length === 0) return state;
    const size = state.puzzle.size;
    const start = state.selection[0];
    const sr = Math.floor(start / size);
    const sc = start % size;
    const er = Math.floor(action.cell / size);
    const ec = action.cell % size;
    const dr = er - sr;
    const dc = ec - sc;
    const drSign = Math.sign(dr);
    const dcSign = Math.sign(dc);
    const isStraight = dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc);
    if (!isStraight) return state;
    const length = Math.max(Math.abs(dr), Math.abs(dc)) + 1;
    const line = Array.from({ length }, (_, index) =>
      (sr + drSign * (dr === 0 ? 0 : index * (Math.abs(dr) / Math.max(Math.abs(dr), Math.abs(dc))))) * size
      + (sc + dcSign * (dc === 0 ? 0 : index * (Math.abs(dc) / Math.max(Math.abs(dr), Math.abs(dc)))))
    );
    return { ...state, selection: line };
  }
  if (state.selection.length < 2) return { ...state, selection: [] };
  const found = state.puzzle.paths.find((path) => path.join(",") === state.selection.join(","));
  if (!found || state.found.some((path) => path.join(",") === found.join(","))) {
    return { ...state, selection: [] };
  }
  const nextFound = [...state.found, found];
  return {
    ...state,
    selection: [],
    found: nextFound,
    solved: isWordSearchSolved(state.puzzle, nextFound),
  };
}
