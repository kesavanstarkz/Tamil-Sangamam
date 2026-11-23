import { isLevelSolvable } from "./solver";
import type { LevelDefinition } from "./types";

describe("level solver", () => {
  test("solves a simple கடல் level", () => {
    const level: LevelDefinition = {
      id: 1,
      word: "கடல்",
      chapter: 1,
      pool: ["க்", "அ", "ட்", "அ", "ல்", "இ"],
      hint: "கடல்",
    };
    expect(isLevelSolvable(level)).toBe(true);
  });

  test("rejects an unsolvable pool", () => {
    const level: LevelDefinition = {
      id: 2,
      word: "கடல்",
      chapter: 1,
      pool: ["க்", "இ", "ட்", "ஆ", "ல்"],
      hint: "கடல்",
    };
    expect(isLevelSolvable(level)).toBe(false);
  });

  test("handles distractors and long vowels", () => {
    const level: LevelDefinition = {
      id: 3,
      word: "கா",
      chapter: 2,
      pool: ["க்", "ஆ", "ப்", "இ"],
      hint: "கா",
    };
    expect(isLevelSolvable(level)).toBe(true);
  });
});
