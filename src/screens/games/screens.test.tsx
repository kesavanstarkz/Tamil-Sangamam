import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { createMissingLetterPuzzle, createUnscramblePuzzle, createWordSearchPuzzle, splitWord, toString } from "../../engine";
import type { WordEntry } from "../../words";
import seedBank from "../../../assets/words/wordbank.json";
import { AntaadhiGame } from "./antaadhi";
import { setSyllableTable } from "../../words/syllables";
import { LetterLabGame } from "./letter-lab";
import { MissingLetterGame } from "./missing-letter";
import { UnscrambleGame } from "./unscramble";
import { WordSearchGame } from "./word-search";

jest.mock("react-native-mmkv", () => {
  throw new Error("MMKV must not load in development");
});
jest.mock("@react-native-async-storage/async-storage", () => ({
  multiGet: jest.fn(async (keys: string[]) => keys.map((key) => [key, null])),
  multiSet: jest.fn(async () => undefined),
}));
jest.mock("expo-router", () => ({
  router: { back: jest.fn(), push: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: () => ({}),
}));

const words = seedBank.words as WordEntry[];
setSyllableTable(seedBank.syllables);

describe("Tamil game mode screens", () => {
  test("missing-letter screen accepts its correct syllable", async () => {
    const puzzle = createMissingLetterPuzzle(words, 1);
    const screen = await render(<MissingLetterGame seed={0} entries={words} />);
    await fireEvent.press(screen.getByLabelText(`விருப்பம் ${puzzle.answer}`));
    expect(screen.getByText("வெற்றி!")).toBeTruthy();
  });

  test("unscramble screen accepts a syllable-by-syllable answer", async () => {
    const puzzle = createUnscramblePuzzle(words, 1);
    const screen = await render(<UnscrambleGame seed={0} entries={words} />);
    const solution = splitWord(puzzle.answer).map(toString);
    const used = new Set<number>();
    for (const tile of solution) {
      const index = puzzle.shuffled.findIndex((candidate, candidateIndex) => candidate === tile && !used.has(candidateIndex));
      used.add(index);
      await fireEvent.press(screen.getByTestId(`unscramble-${index}`));
    }
    expect(screen.getByText("வெற்றி!")).toBeTruthy();
  });

  test("letter lab requires both split parts", async () => {
    const screen = await render(<LetterLabGame seed={0} />);
    await fireEvent.press(screen.getByTestId("lab-mei-க்"));
    expect(screen.queryByText("வெற்றி!")).toBeNull();
    await fireEvent.press(screen.getByTestId("lab-uyir-அ"));
    expect(screen.getByText("வெற்றி!")).toBeTruthy();
  });

  test("antaadhi screen accepts a linked word", async () => {
    const starter: WordEntry = { w: "நதி", n: 2, f: 1, d: 1, t: "A", k: "start", e: "link" };
    const followers = Array.from({ length: 4 }, (_, index): WordEntry => ({
      w: `மாலை${index}`,
      n: 2,
      f: index + 2,
      d: 1,
      t: "A",
      k: "link",
      e: `ending:${index}`,
    }));
    const screen = await render(<AntaadhiGame seed={0} entries={[starter, ...followers]} />);
    await fireEvent.press(screen.getByText(followers[0].w));
    expect(screen.getByText("வெற்றி!")).toBeTruthy();
  });

  test("word-search screen accepts a dragged word path", async () => {
    const puzzle = createWordSearchPuzzle(words, 1, 1);
    const screen = await render(<WordSearchGame seed={0} entries={words} />);
    for (const path of puzzle.paths) {
      await fireEvent.press(screen.getByTestId(`word-search-cell-${path[0]}`));
      await fireEvent.press(screen.getByTestId(`word-search-cell-${path[path.length - 1]}`));
    }
    await waitFor(() => expect(screen.getByText("வெற்றி!")).toBeTruthy());
  });
});
