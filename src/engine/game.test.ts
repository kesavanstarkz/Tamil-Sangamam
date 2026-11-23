import {
  getHint,
  getSolution,
  initLevel,
  isDeadEnd,
  isWon,
  mergeTiles,
  placeTile,
  playMove,
  restart,
  undo,
} from "./game";
import { levels } from "../levels";

describe("pure puzzle game rules", () => {
  test.each(levels)("solver moves win level $id ($word)", (level) => {
    let state = initLevel(level);
    const solution = getSolution(state);
    expect(solution).not.toBeNull();
    for (const move of solution ?? []) state = playMove(state, move);
    expect(isWon(state)).toBe(true);
  });

  test("wrong but valid merge can dead-end and undo restores the level", () => {
    const level = levels.find((item) => item.word === "அம்மா");
    if (!level) throw new Error("Missing அம்மா test level");
    let state = initLevel(level);
    state = mergeTiles(state, "tile-1-0", "tile-1-1");
    expect(isDeadEnd(state)).toBe(true);
    state = undo(state);
    expect(isDeadEnd(state)).toBe(false);
    for (const move of getSolution(state) ?? []) state = playMove(state, move);
    expect(isWon(state)).toBe(true);
  });

  test("wrong slot counts a mistake without changing tiles or slots", () => {
    let state = initLevel(levels[0]);
    const beforePool = state.pool;
    state = placeTile(state, "tile-1-1", 0);
    expect(state.mistakes).toBe(1);
    expect(state.pool).toBe(beforePool);
    expect(state.slots.every((slot) => slot === null)).toBe(true);
  });

  test("hints start at three, consume one, restart resets, and kids hints are unlimited", () => {
    const normal = initLevel(levels[0]);
    expect(normal.hintsLeft).toBe(3);
    expect(getHint(normal).state.hintsLeft).toBe(2);
    expect(restart(getHint(normal).state).hintsLeft).toBe(3);
    expect(getHint(initLevel(levels[0], { kidsMode: true })).state.hintsLeft).toBe(
      Number.POSITIVE_INFINITY,
    );
  });

  test("kids mode removes chapter distractors while preserving all required pieces", () => {
    const level = levels.find((item) => item.chapter === 2);
    if (!level) throw new Error("Missing chapter 2 test level");
    const normal = initLevel(level);
    const kids = initLevel(level, { kidsMode: true });
    expect(kids.pool.length).toBeLessThan(normal.pool.length);
    expect(getSolution(kids)).not.toBeNull();
  });
});
