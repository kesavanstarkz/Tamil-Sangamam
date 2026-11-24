import { getWordBank, getWords } from "./index";

describe("lazy indexed word bank", () => {
  test("returns seeded, filtered word sets and indexes", async () => {
    const first = await getWords({ tier: "A", minD: 1, maxD: 1, count: 4, seed: 871 });
    const repeat = await getWords({ tier: "A", minD: 1, maxD: 1, count: 4, seed: 871 });
    expect(first.map((entry) => entry.w)).toEqual(repeat.map((entry) => entry.w));
    expect(first).toHaveLength(4);
    expect(first.every((entry) => entry.t === "A" && entry.d === 1)).toBe(true);

    const twoSyllableWords = await getWords({ tier: "A", n: 2 });
    expect(twoSyllableWords.every((entry) => entry.n === 2)).toBe(true);

    const bank = await getWordBank();
    expect(bank.byDifficulty["1"].length).toBeGreaterThan(0);
    expect(bank.byFirstSyllable[first[0].k]).toContain(bank.words.findIndex((entry) => entry.w === first[0].w));
  });
});
