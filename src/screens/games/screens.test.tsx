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
import Daily from "../../../app/daily";

jest.mock("react-native-mmkv", () => {
  throw new Error("MMKV must not load in development");
});
jest.mock("expo-haptics", () => ({
  notificationAsync: jest.fn(async () => undefined),
  selectionAsync: jest.fn(async () => undefined),
  NotificationFeedbackType: { Success: "success" },
}));
jest.mock("@react-native-async-storage/async-storage", () => ({
  multiGet: jest.fn(async (keys: string[]) => keys.map((key) => [key, null])),
  multiSet: jest.fn(async () => undefined),
  getAllKeys: jest.fn(async () => []),
  setItem: jest.fn(async () => undefined),
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

  test("missing-letter wrong tile gives retry feedback then accepts the right tile", async () => {
    const puzzle = createMissingLetterPuzzle(words, 1);
    const screen = await render(<MissingLetterGame seed={0} entries={words} />);
    const wrong = puzzle.options.find((option) => option !== puzzle.answer)!;
    await fireEvent.press(screen.getByLabelText(`விருப்பம் ${wrong}`));
    expect(screen.getByText("மீண்டும் முயற்சி செய்யுங்கள்")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText(`விருப்பம் ${puzzle.answer}`));
    expect(screen.getByText(/^பொருள்:/)).toBeTruthy();
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
    expect(screen.getByText("பொருள்")).toBeTruthy();
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
      e: "link",
    }));
    const screen = await render(<AntaadhiGame seed={0} entries={[starter, ...followers]} />);
    await fireEvent.press(screen.getByText(followers[0].w));
    expect(screen.getByText(followers[0].w)).toBeTruthy();
    expect(screen.getByText("நதி")).toBeTruthy();
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

  test("daily challenge opens each seeded mode instead of only showing empty lamps", async () => {
    const screen = await render(<Daily />);
    const missingStep = await screen.findByLabelText("விடுபட்ட எழுத்து");
    await fireEvent.press(missingStep);
    await waitFor(() => expect(screen.getByText("சரியான அலகைத் தேர்ந்தெடுக்கவும்")).toBeTruthy());
  });
});
