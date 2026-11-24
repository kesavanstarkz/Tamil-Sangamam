import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { antaadhiReducer, createAntaadhiState, getAntaadhiFollowers } from "../../engine";
import type { AntaadhiState } from "../../engine/antaadhi";
import { getWordBank } from "../../words";
import type { WordBankData, WordEntry } from "../../words";
import { colors, spacing, typography } from "../../theme";
import { ChoiceButton, GameFrame, ModeLoading, useModeProgress } from "./common";

function buildIndex(words: WordEntry[]): Record<string, number[]> {
  const index: Record<string, number[]> = {};
  words.forEach((word, position) => { (index[word.k] ??= []).push(position); });
  return index;
}

function tieredIndex(bank: WordBankData, words: WordEntry[]): Record<string, number[]> {
  if (words === bank.words) return bank.byFirstSyllable;
  const localPositions = new Map(words.map((word, position) => [word.w, position]));
  return Object.fromEntries(
    Object.entries(bank.byFirstSyllable).map(([key, globalPositions]) => [
      key,
      globalPositions.flatMap((globalPosition) => {
        const word = bank.words[globalPosition];
        const localPosition = word ? localPositions.get(word.w) : undefined;
        return localPosition === undefined ? [] : [localPosition];
      }),
    ]),
  );
}

function eligibleStarts(words: WordEntry[], index: Record<string, number[]>): WordEntry[] {
  return words.filter(
    (word) => word.e !== null && getAntaadhiFollowers(words, word.w, index).length >= 4,
  );
}

export function AntaadhiGame({ seed = 0, entries }: { seed?: number; entries?: WordEntry[] }) {
  const mode = "antaadhi";
  const { stage, streak, advance, ready, error: progressError } = useModeProgress(mode);
  const [bank, setBank] = React.useState<WordBankData | null>(null);
  const [game, setGame] = React.useState<AntaadhiState>();
  const [error, setError] = React.useState<string>();
  React.useEffect(() => {
    if (entries) return;
    let active = true;
    getWordBank()
      .then((loaded) => { if (active) setBank(loaded); })
      .catch((cause: unknown) => { if (active) setError(String(cause)); });
    return () => { active = false; };
  }, [entries]);
  const words = React.useMemo(
    () => entries ?? (bank ? (stage > 20 ? bank.words : bank.words.filter((word) => word.t === "A")) : null),
    [bank, entries, stage],
  );
  const firstSyllableIndex = React.useMemo(() => {
    if (!words) return undefined;
    return bank ? tieredIndex(bank, words) : buildIndex(words);
  }, [bank, words]);
  const generated = React.useMemo((): { game?: AntaadhiState; error?: string } => {
    if (!words || !firstSyllableIndex) return {};
    const starts = eligibleStarts(words, firstSyllableIndex);
    if (starts.length === 0) {
      return { error: "அந்தாதி தொடக்கச் சொற்கள் இன்னும் தயாராகவில்லை" };
    }
    try {
      return {
        game: createAntaadhiState(words, starts[seed % starts.length].w, firstSyllableIndex),
      };
    } catch (cause) {
      return { error: String(cause) };
    }
  }, [firstSyllableIndex, seed, words]);
  const activeGame = game ?? generated.game;
  if (!ready) return <ModeLoading error={progressError} />;
  if (!activeGame) return <ModeLoading error={error ?? generated.error} />;
  const currentWord = activeGame.chain[activeGame.chain.length - 1];
  const followers = getAntaadhiFollowers(activeGame.words, currentWord, activeGame.followers)
    .filter((word) => !activeGame.chain.includes(word));
  const nextWords = bank && stage >= 20 ? bank.words : activeGame.words;
  const nextIndex = bank && stage >= 20 ? bank.byFirstSyllable : activeGame.followers;
  const starts = eligibleStarts(nextWords, nextIndex);
  const nextStart = starts[stage % Math.max(1, starts.length)]?.w ?? activeGame.chain[0];
  return (
    <GameFrame mode={mode} stage={stage} streak={streak} solved={activeGame.solved || followers.length === 0} error={progressError} onNext={() => {
      void advance().then((saved) => {
        if (!saved) return;
        setGame((current) => ({
          ...antaadhiReducer(
            current ?? activeGame,
            followers.length === 0
              ? { type: "reset", start: nextStart }
              : { type: "continue" },
          ),
          words: nextWords,
          followers: nextIndex,
        }));
      });
    }}>
      <Text style={styles.instruction}>கடைசி அலகில் தொடங்கும் சொல்லைத் தேர்ந்தெடுக்கவும்</Text>
      <View style={styles.chain}>
        {activeGame.chain.map((word, index) => <Text key={`${index}-${word}`} style={styles.chainWord}>{word}</Text>)}
      </View>
      <Text style={styles.score}>தொடர்: {activeGame.score} · சிறந்த தொடர்: {activeGame.bestScore}</Text>
      <View style={styles.options}>
        {followers.slice(0, 8).map((word) => (
          <ChoiceButton
            key={word}
            label={word}
            onPress={() => setGame((current) => antaadhiReducer(current ?? activeGame, { type: "choose", word }))}
          />
        ))}
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  instruction: { color: colors.sandalCream, fontSize: typography.body, textAlign: "center", marginVertical: spacing.lg },
  chain: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
  chainWord: { color: colors.turmeric, fontSize: typography.heading, fontWeight: "700", margin: spacing.xs },
  score: { color: colors.palmLeaf, fontSize: typography.body, marginVertical: spacing.md },
  options: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
});
