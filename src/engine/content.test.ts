import { getDailyDifficulty, getDailyPuzzles, getDailySeed } from "./daily";
import { scoreTrace } from "./tracing";
import { toTamilNumerals } from "../theme/numerals";
import { TOPIC_WORDS, createTopicLevel } from "../content/topics";
import { isLevelSolvable } from "./solver";
import { splitWord } from "./tiles";

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
  expect(getDailySeed("2026-11-24", 0)).not.toBe(getDailySeed("2026-11-25", 0));
  expect(getDailyDifficulty("2026-11-23")).toBe(1);
  expect(getDailyDifficulty("2026-11-29")).toBe(7);
});

test("all topic starter words form solver-valid Tamil pools", () => {
  for (const topic of Object.keys(TOPIC_WORDS) as (keyof typeof TOPIC_WORDS)[]) {
    const wordsForTopic: readonly string[] = TOPIC_WORDS[topic];
    wordsForTopic.forEach((word, index) => {
      const level = createTopicLevel(topic, index + 1);
      expect(splitWord(word).map((tile) => tile.kind).length).toBeGreaterThan(0);
      expect(isLevelSolvable(level)).toBe(true);
    });
  }
});

test("trace score thresholds", () => {
  const samples = Array.from({ length: 100 }, (_, i) => ({ x: i, y: i }));
  expect(scoreTrace([], 0, 0)).toBe(0);
  expect(scoreTrace(samples, 80, 20)).toBe(0);
  expect(scoreTrace(samples, 10, 75)).toBe(1);
  expect(scoreTrace(samples, 10, 85)).toBe(2);
  expect(scoreTrace(samples, 5, 92)).toBe(3);
});
