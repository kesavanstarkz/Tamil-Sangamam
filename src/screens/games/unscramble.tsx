import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { createUnscramblePuzzle, unscrambleReducer, parseTile } from "../../engine";
import type { UnscrambleState } from "../../engine/unscramble";
import { getWords } from "../../words";
import type { WordEntry } from "../../words";
import { CarvedSlot, colors, PalmLeafTile, spacing, typography } from "../../theme";
import { getWordMeaning } from "../../content/word-meanings";
import { GameFrame, ModeLoading, useModeProgress } from "./common";

export function UnscrambleGame({ seed = 0, entries, onComplete }: { seed?: number; entries?: WordEntry[]; onComplete?: () => void }) {
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
  React.useEffect(() => {
    if (!activeGame?.wrong) return;
    const timer = setTimeout(() => {
      setGame((current) => current ? unscrambleReducer(current, { type: "reset" }) : current);
    }, 600);
    return () => clearTimeout(timer);
  }, [activeGame?.wrong]);
  if (!ready) return <ModeLoading error={progressError} />;
  if (!activeGame) return <ModeLoading error={error ?? generated.error} />;
  const chosenIndexes = new Set(activeGame.chosen.map((item) => Number(item.slice(0, item.indexOf(":")))));
  const chosen = activeGame.chosen.map((item) => item.slice(item.indexOf(":") + 1));
  const meaning = getWordMeaning(activeGame.answer);
  return (
    <GameFrame mode={mode} stage={stage} streak={streak} solved={activeGame.solved} error={progressError} onComplete={onComplete} onNext={() => {
      void advance().then((saved) => { if (saved) setGame(undefined); });
    }}>
      <Text style={styles.prompt}>அலகுகளைச் சரியான வரிசையில் தொடவும்</Text>
      <View style={styles.row}>
        {activeGame.shuffled.map((_, index) => {
          const position = index < activeGame.chosen.length ? index : -1;
          const tile = position >= 0 ? chosen[position] : undefined;
          return (
            <Pressable
              key={`slot-${index}`}
              accessibilityRole="button"
              accessibilityLabel={tile ? `இடம் ${index + 1}, ${tile}` : `காலி இடம் ${index + 1}`}
              testID={`unscramble-slot-${index}`}
              onPress={() => {
                if (position >= 0) setGame((current) => unscrambleReducer(current ?? activeGame, { type: "remove", position }));
              }}
            >
              <CarvedSlot value={tile} />
            </Pressable>
          );
        })}
      </View>
      <View style={styles.row}>
        {activeGame.shuffled.map((tile, index) => (
          <PalmLeafTile
            key={`${index}-${tile}`}
            tile={parseTile(tile)}
            size="small"
            testID={`unscramble-${index}`}
            disabled={chosenIndexes.has(index)}
            onPress={() => setGame((current) => unscrambleReducer(current ?? activeGame, { type: "pick", index }))}
          />
        ))}
      </View>
      {activeGame.wrong ? <Text style={styles.wrong}>மீண்டும் முயற்சி செய்யுங்கள்</Text> : null}
      {activeGame.solved ? (
        <View style={styles.meaning}>
          <Text style={styles.meaningTitle}>பொருள்</Text>
          <Text style={styles.meaningText}>{meaning.meaning}</Text>
          <Text style={styles.meaningText}>எடுத்துக்காட்டு: {meaning.example}</Text>
        </View>
      ) : null}
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
  wrong: { color: colors.palmLeaf, fontSize: typography.body, marginTop: spacing.sm },
  meaning: { backgroundColor: colors.palmLeaf, borderRadius: 8, padding: spacing.md, marginVertical: spacing.md, maxWidth: 380 },
  meaningTitle: { color: colors.ink, fontSize: typography.body, fontWeight: "800" },
  meaningText: { color: colors.ink, fontSize: typography.label, lineHeight: 26, marginTop: spacing.xs },
});
