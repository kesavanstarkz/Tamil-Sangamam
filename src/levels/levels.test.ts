import fs from "fs";
import path from "path";
import { getSolution, initLevel, isLevelSolvable, parseTile, playMove } from "../engine";
import { levels } from "./index";

describe("all shipped levels", () => {
  test("exactly 50 levels exist", () => {
    expect(levels).toHaveLength(50);
  });

  test("every level pool is solvable", () => {
    for (const level of levels) {
      for (const tile of level.pool) {
        try {
          parseTile(tile);
        } catch {
          throw new Error(`Level ${level.id} (${level.word}) has invalid tile "${tile}"`);
        }
      }
      expect(level.pool.every((text) => parseTile(text).kind !== "uyirmei")).toBe(true);
      expect(isLevelSolvable(level)).toBe(true);
    }
  });

  test("solver moves complete every level in the reducer", () => {
    for (const level of levels) {
      let state = initLevel(level);
      const moves = getSolution(state);
      expect(moves).not.toBeNull();
      for (const move of moves ?? []) state = playMove(state, move);
      expect(state.slots.every((slot) => slot !== null)).toBe(true);
    }
  });

  test("chapter files exist", () => {
    for (let chapter = 1; chapter <= 5; chapter += 1) {
      expect(fs.existsSync(path.join(__dirname, `chapter${chapter}.json`))).toBe(true);
    }
  });
});
