import fs from "node:fs";
import path from "node:path";
import { splitWord } from "../src/engine/tiles";
import { PULLI, VOWEL_NAMES } from "../src/engine/tamil";
import type { LevelDefinition, Tile } from "../src/engine/types";

const levelDirectory = path.resolve("src/levels");
const distractors: Record<number, string[]> = {
  1: [],
  2: ["ங்", "ஊ"],
  3: ["ஞ்", "ஐ"],
  4: ["ற்", "எ"],
  5: ["ங்", "ஔ"],
};

function rawParts(tile: Tile): string[] {
  if (tile.kind === "mei") return [`${tile.base}${PULLI}`];
  if (tile.kind === "uyir") return [VOWEL_NAMES[tile.id]];
  return [`${tile.base}${PULLI}`, VOWEL_NAMES[tile.uyirId]];
}

for (let chapter = 1; chapter <= 5; chapter += 1) {
  const file = path.join(levelDirectory, `chapter${chapter}.json`);
  const levels = JSON.parse(fs.readFileSync(file, "utf8")) as LevelDefinition[];
  const generated = levels.map((level) => ({
    ...level,
    pool: [...splitWord(level.word).flatMap(rawParts), ...distractors[chapter]],
  }));
  fs.writeFileSync(file, `${JSON.stringify(generated, null, 2)}\n`, "utf8");
}
