import type { LevelDefinition, Tile } from "./types";
import { merge, parseTile, splitWord, tileEquals } from "./tiles";
import { PULLI, VOWEL_NAMES } from "./tamil";

export interface GameTile {
  id: string;
  tile: Tile;
}

interface Snapshot {
  slots: (Tile | null)[];
  pool: GameTile[];
  mistakes: number;
  hintsLeft: number;
  nextTileId: number;
}

export interface GameState extends Snapshot {
  level: LevelDefinition;
  target: Tile[];
  history: Snapshot[];
  unlimitedHints: boolean;
}

export type GameMove =
  | { type: "merge"; idA: string; idB: string }
  | { type: "place"; tileId: string; slotIndex: number };

export interface GameHint {
  type: "merge" | "place";
  tileIds: string[];
  slotIndex: number;
}

function snapshot(state: GameState): Snapshot {
  return {
    slots: [...state.slots],
    pool: state.pool.map((entry) => ({ ...entry, tile: { ...entry.tile } })),
    mistakes: state.mistakes,
    hintsLeft: state.hintsLeft,
    nextTileId: state.nextTileId,
  };
}

function withHistory(state: GameState, next: Snapshot): GameState {
  return { ...state, ...next, history: [...state.history, snapshot(state)] };
}

export function initLevel(level: LevelDefinition, options: { kidsMode?: boolean } = {}): GameState {
  const rawPool = options.kidsMode
    ? splitWord(level.word).flatMap((tile) => {
        if (tile.kind === "mei") return [`${tile.base}${PULLI}`];
        if (tile.kind === "uyir") return [VOWEL_NAMES[tile.id]];
        return [`${tile.base}${PULLI}`, VOWEL_NAMES[tile.uyirId]];
      })
    : level.pool;
  const pool = rawPool.map((text, index) => ({
    id: `tile-${level.id}-${index}`,
    tile: parseTile(text),
  }));
  return {
    level,
    target: splitWord(level.word),
    slots: splitWord(level.word).map(() => null),
    pool,
    history: [],
    mistakes: 0,
    hintsLeft: options.kidsMode ? Number.POSITIVE_INFINITY : 3,
    unlimitedHints: options.kidsMode ?? false,
    nextTileId: pool.length,
  };
}

export function mergeTiles(state: GameState, idA: string, idB: string): GameState {
  if (idA === idB) return state;
  const indexA = state.pool.findIndex((entry) => entry.id === idA);
  const indexB = state.pool.findIndex((entry) => entry.id === idB);
  if (indexA < 0 || indexB < 0) return state;

  const result = merge(state.pool[indexA].tile, state.pool[indexB].tile);
  if (!result) return { ...state, mistakes: state.mistakes + 1 };

  const remaining = state.pool.filter((_, index) => index !== indexA && index !== indexB);
  remaining.push({ id: `tile-${state.level.id}-${state.nextTileId}`, tile: result });
  return withHistory(state, {
    ...snapshot(state),
    pool: remaining,
    nextTileId: state.nextTileId + 1,
  });
}

export function placeTile(state: GameState, tileId: string, slotIndex: number): GameState {
  const nextSlot = state.slots.findIndex((slot) => slot === null);
  const entryIndex = state.pool.findIndex((entry) => entry.id === tileId);
  if (
    nextSlot < 0 ||
    slotIndex !== nextSlot ||
    entryIndex < 0 ||
    !tileEquals(state.pool[entryIndex].tile, state.target[nextSlot])
  ) {
    return { ...state, mistakes: state.mistakes + 1 };
  }

  const entry = state.pool[entryIndex];
  const slots = [...state.slots];
  slots[nextSlot] = entry.tile;
  return withHistory(state, {
    ...snapshot(state),
    slots,
    pool: state.pool.filter((_, index) => index !== entryIndex),
  });
}

export function undo(state: GameState): GameState {
  const previous = state.history[state.history.length - 1];
  if (!previous) return state;
  return {
    ...state,
    ...previous,
    history: state.history.slice(0, -1),
  };
}

export function restart(state: GameState): GameState {
  return initLevel(state.level, { kidsMode: state.unlimitedHints });
}

export function isWon(state: GameState): boolean {
  return state.slots.every((slot, index) => slot !== null && tileEquals(slot, state.target[index]));
}

function searchSolution(state: GameState): GameMove[] | null {
  const memo = new Set<string>();

  function visit(
    pool: GameTile[],
    slots: (Tile | null)[],
    nextTileId: number,
  ): GameMove[] | null {
    const nextSlot = slots.findIndex((slot) => slot === null);
    if (nextSlot < 0) return [];

    const key = `${nextSlot}|${nextTileId}|${pool
      .map((entry) => `${entry.id}:${entry.tile.kind}:${"base" in entry.tile ? entry.tile.base : ""}:${"id" in entry.tile ? entry.tile.id : "uyirId" in entry.tile ? entry.tile.uyirId : ""}`)
      .sort()
      .join(",")}`;
    if (memo.has(key)) return null;
    memo.add(key);

    const wanted = state.target[nextSlot];
    for (let index = 0; index < pool.length; index += 1) {
      if (!tileEquals(pool[index].tile, wanted)) continue;
      const nextPool = pool.filter((_, candidate) => candidate !== index);
      const nextSlots = [...slots];
      nextSlots[nextSlot] = pool[index].tile;
      const remainder = visit(nextPool, nextSlots, nextTileId);
      if (remainder) {
        return [{ type: "place", tileId: pool[index].id, slotIndex: nextSlot }, ...remainder];
      }
    }

    for (let first = 0; first < pool.length; first += 1) {
      for (let second = first + 1; second < pool.length; second += 1) {
        const merged = merge(pool[first].tile, pool[second].tile);
        if (!merged) continue;
        if (!state.target.slice(nextSlot).some((tile) => tileEquals(tile, merged))) continue;
        const nextPool = pool.filter((_, index) => index !== first && index !== second);
        const mergedId = `tile-${state.level.id}-${nextTileId}`;
        nextPool.push({ id: mergedId, tile: merged });
        const remainder = visit(nextPool, slots, nextTileId + 1);
        if (remainder) {
          return [{ type: "merge", idA: pool[first].id, idB: pool[second].id }, ...remainder];
        }
      }
    }
    return null;
  }

  return visit(state.pool, state.slots, state.nextTileId);
}

export function getSolution(state: GameState): GameMove[] | null {
  return searchSolution(state);
}

export function isDeadEnd(state: GameState): boolean {
  return !isWon(state) && searchSolution(state) === null;
}

export function getHint(state: GameState): { state: GameState; hint: GameHint | null } {
  if (!state.unlimitedHints && state.hintsLeft <= 0) return { state, hint: null };
  const move = searchSolution(state)?.[0];
  if (!move) return { state, hint: null };
  const nextState = state.unlimitedHints
    ? state
    : { ...state, hintsLeft: state.hintsLeft - 1 };
  return {
    state: nextState,
    hint:
      move.type === "merge"
        ? { type: "merge", tileIds: [move.idA, move.idB], slotIndex: -1 }
        : { type: "place", tileIds: [move.tileId], slotIndex: move.slotIndex },
  };
}

export function playMove(state: GameState, move: GameMove): GameState {
  return move.type === "merge"
    ? mergeTiles(state, move.idA, move.idB)
    : placeTile(state, move.tileId, move.slotIndex);
}
