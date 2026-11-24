import { getDailyPuzzles } from "./daily";
import { scoreTrace } from "./tracing";
import { toTamilNumerals } from "../theme/numerals";

test("Tamil numerals are positional", () => {
  expect(toTamilNumerals(0)).toBe("௦");
  expect(toTamilNumerals(7)).toBe("௭");
  expect(toTamilNumerals(10)).toBe("௧௦");
  expect(toTamilNumerals(25)).toBe("௨௫");
  expect(toTamilNumerals(100)).toBe("௧௦௦");
  expect(toTamilNumerals(2026)).toBe("௨௦௨௬");
});

test("daily puzzles are deterministic", () => {
  expect(getDailyPuzzles("2026-11-24")).toEqual(getDailyPuzzles("2026-11-24"));
  expect(getDailyPuzzles("2026-11-24")).not.toEqual(getDailyPuzzles("2026-11-25"));
});

test("trace score thresholds", () => {
  const samples = Array.from({ length: 100 }, (_, i) => ({ x: i, y: i }));
  expect(scoreTrace([], 0, 0)).toBe(0);
  expect(scoreTrace(samples, 80, 20)).toBe(0);
  expect(scoreTrace(samples, 10, 75)).toBe(1);
  expect(scoreTrace(samples, 10, 85)).toBe(2);
  expect(scoreTrace(samples, 5, 92)).toBe(3);
});
