export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(items: readonly T[], random: () => number): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swap]] = [shuffled[swap], shuffled[index]];
  }
  return shuffled;
}

export function seededSample<T>(
  items: readonly T[],
  count: number,
  random: () => number,
): T[] {
  const wanted = Math.max(0, Math.min(items.length, count));
  if (wanted > items.length / 2) return seededShuffle(items, random).slice(0, wanted);
  const selected = new Set<number>();
  while (selected.size < wanted) selected.add(Math.floor(random() * items.length));
  return [...selected].map((index) => items[index]);
}
