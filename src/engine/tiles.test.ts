import { merge, splitWord, tileEquals, toString, parseTile } from "./tiles";
import { NATIVE_MEIS } from "./tamil";
import type { Tile, Uyirmei } from "./types";

describe("Tamil tile merge engine", () => {
  test("merges Mei and Uyir in either order", () => {
    expect(merge({ kind: "mei", base: "க" }, { kind: "uyir", id: 0 })).toEqual({
      kind: "uyirmei",
      base: "க",
      uyirId: 0,
    });
    expect(merge({ kind: "uyir", id: 1 }, { kind: "mei", base: "ப" })).not.toBeNull();
  });

  test("rejects all merges that are not Mei plus Uyir", () => {
    const mei = { kind: "mei", base: "க" } as const;
    const uyir = { kind: "uyir", id: 2 } as const;
    expect(merge(mei, mei)).toBeNull();
    expect(merge(uyir, uyir)).toBeNull();
    expect(merge({ kind: "uyirmei", base: "க", uyirId: 0 }, uyir)).toBeNull();
  });

  test("renders every native consonant and vowel combination", () => {
    const expected = [
      "", "ா", "ி", "ீ", "ு", "ூ", "ெ", "ே", "ை", "ொ", "ோ", "ௌ",
    ];
    for (const base of NATIVE_MEIS) {
      for (let uyirId = 0; uyirId < 12; uyirId += 1) {
        const mei = { kind: "mei", base } as const;
        const uyir = { kind: "uyir", id: uyirId } as const;
        const merged = merge(mei, uyir);
        expect(merged).not.toBeNull();
        expect(toString(merged as Tile)).toBe(`${base}${expected[uyirId]}`);
      }
    }
  });

  test("round-trips all 18 by 12 combinations through splitWord", () => {
    for (const base of NATIVE_MEIS) {
      for (let uyirId = 0; uyirId < 12; uyirId += 1) {
        const merged = merge(
          { kind: "mei", base },
          { kind: "uyir", id: uyirId },
        ) as Uyirmei;
        const split = splitWord(toString(merged));
        expect(split).toHaveLength(1);
        expect(tileEquals(split[0], merged)).toBe(true);
      }
    }
  });

  test("keeps standalone vowels separate", () => {
    expect(splitWord("அம்மா")).toEqual([
      { kind: "uyir", id: 0 },
      { kind: "mei", base: "ம" },
      { kind: "uyirmei", base: "ம", uyirId: 1 },
    ]);
  });

  test("splits two-part vowel signs and bare mei endings", () => {
    expect(toString({ kind: "uyirmei", base: "க", uyirId: 9 })).toBe("கொ");
    expect(splitWord("சொல்")).toEqual([
      { kind: "uyirmei", base: "ச", uyirId: 9 },
      { kind: "mei", base: "ல" },
    ]);
    expect(splitWord("கடல்")).toEqual([
      { kind: "uyirmei", base: "க", uyirId: 0 },
      { kind: "uyirmei", base: "ட", uyirId: 0 },
      { kind: "mei", base: "ல" },
    ]);
  });

  test("parses common tile strings", () => {
    expect(parseTile("க்")).toEqual({ kind: "mei", base: "க" });
    expect(parseTile("அ")).toEqual({ kind: "uyir", id: 0 });
    expect(parseTile("கா")).toEqual({ kind: "uyirmei", base: "க", uyirId: 1 });
  });
});
