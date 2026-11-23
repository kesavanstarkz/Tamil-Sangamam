export const NATIVE_MEIS = [
  "க",
  "ங",
  "ச",
  "ஞ",
  "ட",
  "ண",
  "த",
  "ந",
  "ப",
  "ம",
  "ய",
  "ர",
  "ல",
  "வ",
  "ழ",
  "ள",
  "ற",
  "ன",
] as const;

export const VOWEL_NAMES = [
  "அ",
  "ஆ",
  "இ",
  "ஈ",
  "உ",
  "ஊ",
  "எ",
  "ஏ",
  "ஐ",
  "ஒ",
  "ஓ",
  "ஔ",
] as const;

export const VOWEL_SIGNS = [
  "",
  "ா",
  "ி",
  "ீ",
  "ு",
  "ூ",
  "ெ",
  "ே",
  "ை",
  "ொ",
  "ோ",
  "ௌ",
] as const;

export const PULLI = "\u0BCD";

export function isNativeMei(character: string): boolean {
  return (NATIVE_MEIS as readonly string[]).includes(character);
}
