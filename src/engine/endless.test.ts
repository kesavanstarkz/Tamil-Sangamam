import { createEndlessLevel, difficultyForStage, initLevel, isLevelSolvable, parseTile } from "./index";
import wordbank from "../../assets/words/wordbank.json";
import type { WordEntry } from "../words/types";

const words = wordbank.words as WordEntry[];

describe("endless build levels", () => {
  test("ramps difficulty in five-stage bands", () => {
    expect([1, 5, 6, 10, 11, 25].map(difficultyForStage)).toEqual([1, 1, 2, 2, 3, 5]);
  });

  test.each(Array.from({ length: 500 }, (_, index) => index + 1))(
    "solver accepts endless level seed %i",
    (stage) => {
      const difficulty = (stage - 1) % 5 + 1;
      const adjustedStage = Math.floor((stage - 1) / 5) * 5 + difficulty;
      const level = createEndlessLevel(
        words.filter((word) => word.t === "A"),
        adjustedStage,
        stage,
      );
      expect(level).toBeDefined();
      expect(isLevelSolvable(level)).toBe(true);
      expect(initLevel(level).target.length).toBeGreaterThan(0);
      expect(level.pool.every((part) => {
        const tile = parseTile(part);
        return tile.kind !== "uyirmei";
      })).toBe(true);
    },
  );
});
