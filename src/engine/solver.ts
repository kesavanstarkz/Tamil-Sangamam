import { getSolution, initLevel } from "./game";
import { findTileIndex } from "./tiles";
import type { LevelDefinition, Tile } from "./types";

export function canPlaceNext(pool: Tile[], target: Tile): boolean {
  return findTileIndex(pool, target) >= 0;
}

export function isLevelSolvable(level: LevelDefinition): boolean {
  return getSolution(initLevel(level)) !== null;
}
