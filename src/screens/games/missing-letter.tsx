import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { createMissingLetterPuzzle, missingLetterReducer, parseTile } from "../../engine";
import type { MissingLetterState } from "../../engine/missing-letter";
import { getWords } from "../../words";
import type { WordEntry } from "../../words";
import { colors, PalmLeafTile, spacing, typography } from "../../theme";
import { GameFrame, ModeLoading, useModeProgress } from "./common";

export function MissingLetterGame({ seed = 0, entries }: { seed?: number; entries?: WordEntry[] }) {
  const mode = "missing";
  const { stage, streak, advance, ready, error: progressError } = useModeProgress(mode);
  const [words, setWords] = React.useState<WordEntry[] | null>(entries ?? null);
  const [error, setError] = React.useState<string>();
  const [game, setGame] = React.useState<MissingLetterState>();

  React.useEffect(() => {
    if (entries) return;
    let active = true;
    getWords({ tier: stage > 20 ? "all" : "A", seed })
      .then((loaded) => { if (active) setWords(loaded); })
      .catch((cause: unknown) => { if (active) setError(String(cause)); });
    return () => { active = false; };
  }, [entries, seed, stage]);

  const generated = React.useMemo((): { game?: MissingLetterState; error?: string } => {
    if (!words) return {};
    try {
      return { game: { ...createMissingLetterPuzzle(words, seed + stage), selected: null, solved: false } };
    } catch (cause) {
      return { error: String(cause) };
    }
  }, [seed, stage, words]);

  const activeGame = game ?? generated.game;
  if (!ready) return <ModeLoading error={progressError} />;
  if (!activeGame) return <ModeLoading error={error ?? generated.error} />;
  const currentGame = activeGame;
  function answer(syllable: string) {
    setGame((current) => missingLetterReducer(current ?? currentGame, { type: "choose", syllable }));
  }
  const visible = activeGame.tiles.map((tile, index) => (
    <View key={`tile-${index}`} style={styles.wordTile}>
      {index === activeGame.hiddenIndex && !activeGame.solved
        ? <Text style={styles.hidden}>?</Text>
        : <PalmLeafTile tile={parseTile(tile)} size="small" />}
    </View>
  ));
  return (
    <GameFrame mode={mode} stage={stage} streak={streak} solved={activeGame.solved} error={progressError} onNext={() => {
      void advance().then((saved) => { if (saved) setGame(undefined); });
    }}>
      <Text style={styles.prompt}>சரியான அலகைத் தேர்ந்தெடுக்கவும்</Text>
      <View style={styles.word}>{visible}</View>
      <View style={styles.options}>
        {activeGame.options.map((option, index) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`விருப்பம் ${option}`}
            testID={`missing-option-${index}`}
            key={`${option}-${index}`}
            disabled={activeGame.wrong?.includes(option)}
            onPress={() => answer(option)}
            style={({ pressed }) => ({ opacity: activeGame.wrong?.includes(option) ? 0.35 : pressed ? 0.78 : 1 })}
          >
            <PalmLeafTile tile={parseTile(option)}             selected={activeGame.selected === option} />
          </Pressable>
        ))}
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  prompt: { color: colors.sandalCream, fontSize: typography.body, marginVertical: spacing.lg },
  word: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", justifyContent: "center" },
  wordTile: { minWidth: 58, minHeight: 66, alignItems: "center", justifyContent: "center" },
  hidden: { width: 52, height: 52, color: colors.turmeric, fontSize: 36, textAlign: "center", borderWidth: 1, borderColor: colors.turmeric, borderRadius: 8 },
  options: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", marginTop: spacing.lg },
});
