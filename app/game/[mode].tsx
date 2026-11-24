import React from "react";
import { useLocalSearchParams } from "expo-router";
import { AntaadhiGame } from "../../src/screens/games/antaadhi";
import { LetterLabGame } from "../../src/screens/games/letter-lab";
import { MissingLetterGame } from "../../src/screens/games/missing-letter";
import { UnscrambleGame } from "../../src/screens/games/unscramble";
import { WordSearchGame } from "../../src/screens/games/word-search";
import type { GameMode } from "../../src/screens/games/common";

const validModes: GameMode[] = ["missing", "unscramble", "letter-lab", "antaadhi", "word-search"];

export default function GameModeRoute() {
  const { mode } = useLocalSearchParams<{ mode: string }>();
  const selected = validModes.find((candidate) => candidate === mode);
  if (selected === "missing") return <MissingLetterGame />;
  if (selected === "unscramble") return <UnscrambleGame />;
  if (selected === "letter-lab") return <LetterLabGame />;
  if (selected === "antaadhi") return <AntaadhiGame />;
  if (selected === "word-search") return <WordSearchGame />;
  return <MissingLetterGame />;
}
