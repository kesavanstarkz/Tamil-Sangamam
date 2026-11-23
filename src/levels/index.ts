import c1 from "./chapter1.json";
import c2 from "./chapter2.json";
import c3 from "./chapter3.json";
import c4 from "./chapter4.json";
import c5 from "./chapter5.json";
import type { LevelDefinition } from "../engine";

export const levels: LevelDefinition[] = [
  ...(c1 as LevelDefinition[]),
  ...(c2 as LevelDefinition[]),
  ...(c3 as LevelDefinition[]),
  ...(c4 as LevelDefinition[]),
  ...(c5 as LevelDefinition[]),
];

export function getChapterLevels(chapter: number): LevelDefinition[] {
  return levels.filter((level) => level.chapter === chapter);
}
