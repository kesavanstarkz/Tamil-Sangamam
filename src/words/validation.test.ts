import { isWordAccepted } from "./validation";

describe("word bank candidate filters", () => {
  const known = new Set(["கடல்", "மரம்"]);
  const blocked = new Set(["போர்"]);

  test.each(["hello", "ஜனம்", "போர்", "கடலுக்கு", "கடல்\u200b"])(
    "rejects invalid candidate %s",
    (word) => {
      expect(isWordAccepted(word, known, blocked)).toBe(false);
    },
  );

  test("rejects words longer than six syllables", () => {
    expect(isWordAccepted("அஅஅஅஅஅஅ", new Set(), new Set())).toBe(false);
  });

  test("accepts a round-tripping native word", () => {
    expect(isWordAccepted("கடல்", known, blocked)).toBe(true);
  });
});
