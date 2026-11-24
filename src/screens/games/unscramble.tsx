import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { createUnscramblePuzzle, unscrambleReducer, parseTile, splitWord } from "../../engine";
import type { UnscrambleState } from "../../engine/unscramble";
import { getWords } from "../../words";
import type { WordEntry } from "../../words";
import { colors, PalmLeafTile, spacing, typography } from "../../theme";
import { GameFrame, ModeLoading, useModeProgress } from "./common";

export function UnscrambleGame({ seed = 0, entries }: { seed?: number; entries?: WordEntry[] }) {
  const mode = "unscramble";
  const { stage, streak, advance, ready, error: progressError } = useModeProgress(mode);
  const [words, setWords] = React.useState<WordEntry[] | null>(entries ?? null);
  const [error, setError] = React.useState<string>();
  const [game, setGame] = React.useState<UnscrambleState>();
  React.useEffect(() => {
    if (entries) return;
    let active = true;
    getWords({ tier: stage > 20 ? "all" : "A", seed })
      .then((loaded) => { if (active) setWords(loaded); })
      .catch((cause: unknown) => { if (active) setError(String(cause)); });
    return () => { active = false; };
  }, [entries, seed, stage]);
  const generated = React.useMemo((): { game?: UnscrambleState; error?: string } => {
    if (!words) return {};
    try {
      return { game: { ...createUnscramblePuzzle(words, seed + stage), chosen: [], solved: false } };
    } catch (cause) {
      return { error: String(cause) };
    }
  }, [seed, stage, words]);
  const activeGame = game ?? generated.game;
  if (!ready) return <ModeLoading error={progressError} />;
  if (!activeGame) return <ModeLoading error={error ?? generated.error} />;
  const chosenIndexes = new Set(activeGame.chosen.map((item) => Number(item.slice(0, item.indexOf(":")))));
  const chosen = activeGame.chosen.map((item) => item.slice(item.indexOf(":") + 1));
  return (
    <GameFrame mode={mode} stage={stage} streak={streak} solved={activeGame.solved} error={progressError} onNext={() => {
      void advance().then((saved) => { if (saved) setGame(undefined); });
    }}>
      <Text style={styles.prompt}>அலகுகளைச் சரியான வரிசையில் தொடவும்</Text>
      <View style={styles.row}>
        {chosen.map((tile, index) => <PalmLeafTile key={`${index}-${tile}`} tile={parseTile(tile)} size="small" />)}
      </View>
      <View style={styles.row}>
        {activeGame.shuffled.map((tile, index) => (
          <Pressable
            key={`${index}-${tile}`}
            accessibilityRole="button"
            accessibilityLabel={`சொல் அலகு ${index + 1}`}
            testID={`unscramble-${index}`}
            disabled={chosenIndexes.has(index)}
            onPress={() => {
              setGame((current) => unscrambleReducer(current ?? activeGame, { type: "pick", index }));
              if (activeGame.chosen.length + 1 === splitWord(activeGame.answer).length && !activeGame.solved) {
                setTimeout(() => setGame((current) => unscrambleReducer(current ?? activeGame, { type: "reset" })), 600);
              }
            }}
            style={{ opacity: chosenIndexes.has(index) ? 0.3 : 1 }}
          >
            <PalmLeafTile tile={parseTile(tile)} size="small" />
          </Pressable>
        ))}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="கடைசி அலகை நீக்கு"
        style={styles.undo}
        onPress={() => setGame((current) => unscrambleReducer(current ?? activeGame, { type: "undo" }))}
      >
        <Text style={styles.undoText}>பின்செல்</Text>
      </Pressable>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  prompt: { color: colors.sandalCream, fontSize: typography.body, marginVertical: spacing.lg, textAlign: "center" },
  row: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", minHeight: 78 },
  undo: { minHeight: 48, minWidth: 100, borderColor: colors.palmLeaf, borderWidth: 1, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  undoText: { color: colors.sandalCream, fontSize: typography.label },
});
