export type DailyMode = "word-build" | "missing" | "unscramble" | "letter-lab" | "antaadhi" | "word-search";

function hash(value: string): number {
  let hashValue = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hashValue ^= value.charCodeAt(index);
    hashValue = Math.imul(hashValue, 16777619);
  }
  return hashValue >>> 0;
}

export function getDailyPuzzles(dateStr: string): DailyMode[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) throw new Error("Daily date must use YYYY-MM-DD");
  const alternate = hash(dateStr) % 2 === 0 ? "antaadhi" : "word-search";
  return ["word-build", "missing", "unscramble", "letter-lab", alternate];
}

export function getDailyDifficulty(dateStr: string): number {
  const day = new Date(`${dateStr}T00:00:00Z`).getUTCDay();
  return day === 0 ? 5 : day;
}
