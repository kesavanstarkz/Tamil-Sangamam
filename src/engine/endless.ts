import { getWords } from "../words";
import type { WordEntry } from "../words/types";
import { isLevelSolvable } from "./solver";
import { splitWord } from "./tiles";
import { PULLI, VOWEL_NAMES } from "./tamil";
import type { LevelDefinition, Tile } from "./types";
import { mulberry32 } from "./random";

const DISTRACTORS: Record<number, string[]> = {
  1: [],
  2: ["ங்", "ஊ"],
  3: ["ஞ்", "ஐ"],
  4: ["ற்", "எ"],
  5: ["ங்", "ஔ"],
};

function rawParts(tile: Tile): string[] {
  if (tile.kind === "mei") return [`${tile.base}${PULLI}`];
  if (tile.kind === "uyir") return [VOWEL_NAMES[tile.id]];
  return [`${tile.base}${PULLI}`, VOWEL_NAMES[tile.uyirId]];
}

export function difficultyForStage(stage: number): number {
  return Math.min(5, Math.max(1, Math.floor((Math.max(1, stage) - 1) / 5) + 1));
}

export function createEndlessLevel(
  words: readonly WordEntry[],
  stage: number,
  seed: number,
): LevelDefinition {
  const difficulty = difficultyForStage(stage);
  const candidates = words.filter(
    (word) =>
      word.d === difficulty &&
      (stage > 20 || word.t === "A") &&
      splitWord(word.w).length === word.n,
  );
  if (candidates.length === 0) {
    throw new Error(`No words available for endless stage ${stage} (difficulty ${difficulty})`);
  }
  const random = mulberry32(seed);
  const first = Math.floor(random() * candidates.length);
  for (let offset = 0; offset < candidates.length; offset += 1) {
    const index = (first + offset) % candidates.length;
    const word = candidates[index];
    const level: LevelDefinition = {
      id: stage * 1000 + index,
      word: word.w,
      chapter: difficulty,
      pool: [
        ...splitWord(word.w).flatMap(rawParts),
        ...DISTRACTORS[difficulty],
      ],
      hint: "சொல்லை உருவாக்குங்கள்",
    };
    if (isLevelSolvable(level)) return level;
  }
  throw new Error(`Solver rejected every candidate for endless stage ${stage}`);
}

export async function loadEndlessLevel(stage: number, seed: number): Promise<LevelDefinition> {
  const difficulty = difficultyForStage(stage);
  const words = await getWords({
    tier: stage > 20 ? "all" : "A",
    minD: difficulty,
    maxD: difficulty,
    seed,
  });
  return createEndlessLevel(words, stage, seed);
}

export function dailySeed(date: Date = new Date()): number {
  return Number(
    `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}${String(
      date.getUTCDate(),
    ).padStart(2, "0")}`,
  );
}
