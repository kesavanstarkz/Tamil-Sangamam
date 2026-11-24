import { isLevelSolvable, splitWord } from "../engine";
import { PULLI, VOWEL_NAMES } from "../engine/tamil";
import type { LevelDefinition, Tile } from "../engine";

export const TOPIC_WORDS = {
  "உறவுகள்": ["அம்மா", "அப்பா", "குடும்பம்", "நண்பன்", "அண்ணன்", "தங்கை"],
  "விலங்குகள்": ["பூனை", "நாய்", "யானை", "ஆடு", "மாடு", "மீன்"],
  "பறவைகள்": ["பறவை", "காகம்", "கிளி", "மயில்", "புறா", "குயில்"],
  "பூக்கள்": ["பூ", "மல்லி", "தாமரை", "செம்பருத்தி", "அல்லி", "முல்லை"],
  "பழங்கள்": ["பழம்", "மாம்பழம்", "பலாப்பழம்", "வாழைப்பழம்", "நெல்லி", "கொய்யா"],
  "காய்கறிகள்": ["காய்", "கீரை", "கத்தரி", "அவரை", "முருங்கை", "பாகற்காய்"],
  "உணவு": ["சோறு", "இட்லி", "தோசை", "அப்பம்", "கூழ்", "பால்"],
  "இயற்கை": ["கடல்", "நதி", "மழை", "காடு", "மரம்", "மலை", "நிலவு", "வானம்"],
  "உடல் உறுப்புகள்": ["கை", "கால்", "கண்", "மூக்கு", "செவி", "தலை"],
  "இடங்கள்": ["வீடு", "பள்ளி", "கோவில்", "ஊர்", "கடை", "காடு"],
} as const;

export type TopicName = keyof typeof TOPIC_WORDS;

function rawParts(tile: Tile): string[] {
  if (tile.kind === "mei") return [`${tile.base}${PULLI}`];
  if (tile.kind === "uyir") return [VOWEL_NAMES[tile.id]];
  return [`${tile.base}${PULLI}`, VOWEL_NAMES[tile.uyirId]];
}

export function createTopicLevel(topic: TopicName, stage: number): LevelDefinition {
  if (!Number.isInteger(stage) || stage < 1 || stage > 30) throw new Error("Topic stage must be from 1 to 30");
  const words = TOPIC_WORDS[topic];
  const word = words[(stage - 1) % words.length];
  const level: LevelDefinition = {
    id: 20_000 + Object.keys(TOPIC_WORDS).indexOf(topic) * 100 + stage,
    word,
    chapter: 6,
    pool: splitWord(word).flatMap(rawParts),
    hint: "சொல்லை உருவாக்குங்கள்",
  };
  if (!isLevelSolvable(level)) throw new Error(`Topic solver rejected ${word}`);
  return level;
}
