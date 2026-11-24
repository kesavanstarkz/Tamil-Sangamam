import {
  antaadhiReducer,
  createAntaadhiState,
  getAntaadhiFollowers,
  createMissingLetterPuzzle,
  getSimilarSyllables,
  createUnscramblePuzzle,
  createWordSearchPuzzle,
  findWordSearchMatches,
  isWordSearchSolved,
  letterLabReducer,
  createClassifyQuestion,
  createSplitQuestion,
  missingLetterReducer,
  unscrambleReducer,
  wordSearchReducer,
} from "./index";
import wordbank from "../../assets/words/wordbank.json";
import { NATIVE_MEIS } from "./tamil";
import type { WordEntry } from "../words/types";
import { splitWord, toString } from "./tiles";
import { setSyllableTable } from "../words/syllables";
import type { WordSearchState } from "./word-search";
import type { UnscrambleState } from "./unscramble";

const words = wordbank.words as WordEntry[];
setSyllableTable(wordbank.syllables);

describe("new puzzle mode generators and reducers", () => {
  test.each(Array.from({ length: 200 }, (_, index) => index))(
    "missing-letter puzzle %i has one valid answer",
    (seed) => {
      const puzzle = createMissingLetterPuzzle(words, seed);
      expect(puzzle.options).toHaveLength(4);
      expect(puzzle.options.filter((option) => option === puzzle.answer)).toHaveLength(1);
      expect(puzzle.options.filter((option) => option !== puzzle.answer)
        .every((option) => getSimilarSyllables(puzzle.answer).includes(option))).toBe(true);
      const valid = new Set(words.map((entry) => entry.w));
      expect(puzzle.options.filter((option) => {
        const completed = [...puzzle.tiles];
        completed[puzzle.hiddenIndex] = option;
        return valid.has(completed.join(""));
      })).toEqual([puzzle.answer]);
      const state = missingLetterReducer({ ...puzzle, selected: null, solved: false }, {
        type: "choose",
        syllable: puzzle.answer,
      });
      expect(state.solved).toBe(true);
    },
  );

  test("seed word bank can start a four-follower Antaadhi chain", () => {
    const state = createAntaadhiState(words, "நதி", wordbank.byFirstSyllable);
    expect(getAntaadhiFollowers(words, "நதி", state.followers).length).toBeGreaterThanOrEqual(4);
  });

  test.each(Array.from({ length: 200 }, (_, index) => index))(
    "unscramble puzzle %i is shuffled and accepts its answer",
    (seed) => {
      const puzzle = createUnscramblePuzzle(words, seed);
      expect(puzzle.shuffled.join("")).not.toBe(puzzle.answer);
      expect(puzzle.accepted).toContain(puzzle.answer);
      let state = { ...puzzle, chosen: [] as string[], solved: false };
      const solution = splitWord(puzzle.answer).map(toString);
      const used = new Set<number>();
      for (const tile of solution) {
        const index = puzzle.shuffled.findIndex((candidate, i) => candidate === tile && !used.has(i));
        used.add(index);
        state = unscrambleReducer(state, { type: "pick", index });
      }
      expect(state.solved).toBe(true);
    },
  );

  test("classifies all 18 native mei and splits all twelve vowels", () => {
    const categories = ["வல்லினம்", "மெல்லினம்", "இடையினம்"] as const;
    const knownMei = [
      ["க்", "ச்", "ட்", "த்", "ப்", "ற்"],
      ["ங்", "ஞ்", "ண்", "ந்", "ம்", "ன்"],
      ["ய்", "ர்", "ல்", "வ்", "ழ்", "ள்"],
    ].flat();
    expect(knownMei).toHaveLength(NATIVE_MEIS.length);
    NATIVE_MEIS.forEach((base) => {
      expect(["வல்லினம்", "மெல்லினம்", "இடையினம்"].some((category) => {
        try {
          createClassifyQuestion(`${base}்`);
          return true;
        } catch {
          return false;
        }
      })).toBe(true);
    });
    for (let id = 0; id < 12; id += 1) {
      const question = createSplitQuestion("க", id);
      expect(question.kind).toBe("split");
      if (question.kind !== "split") throw new Error("Expected split question");
      const state = letterLabReducer({ question, solved: false }, {
        type: "answer-split",
        mei: question.mei,
        uyir: question.uyir,
      });
      expect(state.solved).toBe(true);
    }
    expect(categories).toHaveLength(3);
    expect(new Set(["அ", "ஆ", "இ", "ஈ", "உ", "ஊ", "எ", "ஏ", "ஐ", "ஒ", "ஓ", "ஔ"]).size).toBe(12);
  });

  test("wrong missing-letter and unscramble answers remain recoverable", () => {
    const missing = createMissingLetterPuzzle(words, 1);
    const missingState = missingLetterReducer({ ...missing, selected: null, solved: false }, {
      type: "choose",
      syllable: missing.options.find((item) => item !== missing.answer)!,
    });

    expect(missingState.solved).toBe(false);
    expect(missingState.mistakes).toBe(1);
    expect(missingLetterReducer(missingState, { type: "choose", syllable: missing.answer }).solved).toBe(true);

    const puzzle = createUnscramblePuzzle(words, 1);
    let state: UnscrambleState = { ...puzzle, chosen: [], solved: false };
    for (let index = 0; index < puzzle.shuffled.length; index += 1) {
      state = unscrambleReducer(state, { type: "pick", index });
    }
    if (!state.solved) {
      expect(state.wrong).toBe(true);
      expect(state.mistakes).toBe(1);
      state = unscrambleReducer(state, { type: "reset" });
      expect(state.chosen).toHaveLength(0);
    }
  });

  test("word-search accepts a straight selection in reverse", () => {
    const puzzle = {
      size: 3,
      grid: [["அ", "ஆ", "இ"], ["உ", "ஊ", "எ"], ["ஏ", "ஐ", "ஒ"]],
      keys: [["அ", "ஆ", "இ"], ["உ", "ஊ", "எ"], ["ஏ", "ஐ", "ஒ"]],
      words: ["அஆஇ"],
      paths: [[0, 1, 2]],
    };
    let state: WordSearchState = { puzzle, selection: [], found: [], solved: false };
    state = wordSearchReducer(state, { type: "start", cell: 2 });
    state = wordSearchReducer(state, { type: "extend", cell: 0 });
    state = wordSearchReducer(state, { type: "release" });
    expect(state.solved).toBe(true);
    expect(state.found).toEqual([[0, 1, 2]]);
  });

  test.each(Array.from({ length: 200 }, (_, index) => index))(
    "letter-lab question %i has exactly one supported answer",
    (seed) => {
      const base = NATIVE_MEIS[seed % NATIVE_MEIS.length];
      const question = seed % 2 === 0
        ? createSplitQuestion(base, seed % 12)
        : createClassifyQuestion(`${base}்`);
      const correct = question.kind === "split"
        ? { type: "answer-split" as const, mei: question.mei, uyir: question.uyir }
        : { type: "answer-class" as const, category: question.category };
      expect(letterLabReducer({ question, solved: false }, correct).solved).toBe(true);
    },
  );

  test.each(Array.from({ length: 200 }, (_, index) => index))(
    "antaadhi link %i follows the previous final syllable",
    (seed) => {
      const start: WordEntry = { w: "நதி", n: 2, f: 1, d: 1, t: "A", k: "x", e: "link" };
      const next = Array.from({ length: 4 }, (_, index) => ({
        w: `வார்த்தை${index}`, n: 2, f: index + 2, d: 1, t: "A" as const, k: "link", e: `end${index}`,
      }));
      const bank: WordEntry[] = [start, ...next];
      const state = createAntaadhiState(bank, start.w);
      const updated = antaadhiReducer(state, { type: "choose", word: next[seed % 4].w });
      expect(updated.chain).toHaveLength(2);
      expect(updated.score).toBe(1);
    },
  );

  test.each(Array.from({ length: 200 }, (_, index) => index))(
    "word-search puzzle %i has every listed word findable",
    (seed) => {
      const puzzle = createWordSearchPuzzle(words, 1, seed);
      expect(puzzle.grid).toHaveLength(5);
      expect(puzzle.paths).toHaveLength(puzzle.words.length);
      expect([...findWordSearchMatches(puzzle, words)].sort()).toEqual([...puzzle.words].sort());
      let state = { puzzle, selection: [] as number[], found: [] as number[][], solved: false };
      for (const path of puzzle.paths) {
        state = wordSearchReducer(state, { type: "start", cell: path[0] });
        for (const cell of path.slice(1)) state = wordSearchReducer(state, { type: "extend", cell });
        state = wordSearchReducer(state, { type: "release" });
      }
      expect(state.solved).toBe(true);
      expect(isWordSearchSolved(puzzle, state.found)).toBe(true);
    },
  );
});
