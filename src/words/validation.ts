import { splitWord, toString } from "../engine/tiles";

const INFLECTIONS = ["உடன்", "களை", "உக்கு", "ஆல்", "இல்", "க்கு", "இன்", "கள்", "ஐ"];

export function isWordAccepted(
  word: string,
  knownWords: ReadonlySet<string>,
  blockedWords: ReadonlySet<string>,
): boolean {
  if (!word || blockedWords.has(word)) return false;
  try {
    const syllables = splitWord(word);
    if (syllables.length < 2 || syllables.length > 6) return false;
    if (syllables.map(toString).join("") !== word) return false;
  } catch {
    return false;
  }
  return !INFLECTIONS.some((suffix) => {
    if (!word.endsWith(suffix)) return false;
    const stem = word.slice(0, -suffix.length).replace(/ு$/, "்");
    return knownWords.has(stem);
  });
}
