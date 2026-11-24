import { isNativeMei, PULLI, VOWEL_NAMES, VOWEL_SIGNS } from "./tamil";
import type { Tile } from "./types";

export function merge(a: Tile, b: Tile): Tile | null {
  if (a.kind === "mei" && b.kind === "uyir") {
    return { kind: "uyirmei", base: a.base, uyirId: b.id };
  }
  if (b.kind === "mei" && a.kind === "uyir") {
    return { kind: "uyirmei", base: b.base, uyirId: a.id };
  }
  return null;
}

export function toString(tile: Tile): string {
  if (tile.kind === "mei") return `${tile.base}${PULLI}`;
  if (tile.kind === "uyir") return VOWEL_NAMES[tile.id] ?? "";
  return `${tile.base}${VOWEL_SIGNS[tile.uyirId] ?? ""}`;
}

export function parseTile(text: string): Tile {
  const characters = Array.from(text);

  if (characters.length === 1) {
    const character = characters[0];
    const uyirIndex = VOWEL_NAMES.findIndex((vowel) => vowel === character);
    if (uyirIndex >= 0) return { kind: "uyir", id: uyirIndex };
    if (isNativeMei(character)) {
      return { kind: "uyirmei", base: character, uyirId: 0 };
    }
  }

  if (characters.length === 2 && characters[1] === PULLI && isNativeMei(characters[0])) {
    return { kind: "mei", base: characters[0] };
  }

  if (characters.length >= 2 && isNativeMei(characters[0])) {
    const remainder = text.slice(characters[0].length);
    const uyirIndex = VOWEL_SIGNS.findIndex(
      (candidate) => candidate !== "" && candidate === remainder,
    );
    if (uyirIndex >= 0) {
      return { kind: "uyirmei", base: characters[0], uyirId: uyirIndex };
    }
  }

  throw new Error(`Unsupported Tamil tile: ${text}`);
}

export function splitWord(word: string): Tile[] {
  const characters = Array.from(word);
  const tiles: Tile[] = [];

  for (let index = 0; index < characters.length;) {
    const character = characters[index];

    const uyirIndex = VOWEL_NAMES.findIndex((vowel) => vowel === character);
    if (uyirIndex >= 0) {
      tiles.push({ kind: "uyir", id: uyirIndex });
      index += 1;
      continue;
    }

    if (!isNativeMei(character)) {
      throw new Error(`Unsupported character in Tamil word: ${character}`);
    }

    if (characters[index + 1] === PULLI) {
      tiles.push({ kind: "mei", base: character });
      index += 2;
      continue;
    }

    let uyirId = 0;
    let consumed = 1;

    for (let candidateId = 1; candidateId < VOWEL_SIGNS.length; candidateId += 1) {
      const sign = VOWEL_SIGNS[candidateId];
      if (sign) {
        const remaining = characters.slice(index + 1).join("");
        if (remaining.startsWith(sign)) {
          uyirId = candidateId;
          consumed = 1 + Array.from(sign).length;
          break;
        }
      }
    }

    if (uyirId === 0 && characters[index + 1] === PULLI) {
      tiles.push({ kind: "mei", base: character });
      index += 2;
      continue;
    }

    tiles.push({ kind: "uyirmei", base: character, uyirId });
    index += consumed;
  }

  return tiles;
}

export function tileEquals(a: Tile, b: Tile): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "uyir" && b.kind === "uyir") return a.id === b.id;
  if (a.kind === "mei" && b.kind === "mei") return a.base === b.base;
  if (a.kind === "uyirmei" && b.kind === "uyirmei") {
    return a.base === b.base && a.uyirId === b.uyirId;
  }
  return false;
}

export function tileKey(tile: Tile): string {
  if (tile.kind === "mei") return `m:${tile.base}`;
  if (tile.kind === "uyir") return `u:${tile.id}`;
  return `v:${tile.base}:${tile.uyirId}`;
}

export function findTileIndex(pool: Tile[], tile: Tile): number {
  return pool.findIndex((candidate) => tileEquals(candidate, tile));
}

export function cloneTile<T extends Tile>(tile: T): T {
  return { ...tile };
}
