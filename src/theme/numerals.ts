export function toTamilNumerals(value: number): string {
  const digits = ["௦", "௧", "௨", "௩", "௪", "௫", "௬", "௭", "௮", "௯"];
  return String(Math.max(0, Math.trunc(value))).split("").map((digit) => digits[Number(digit)] ?? digit).join("");
}
