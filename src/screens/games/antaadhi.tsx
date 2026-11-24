import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { antaadhiReducer, createAntaadhiState, getAntaadhiFollowers } from "../../engine";
import type { AntaadhiState } from "../../engine/antaadhi";
import { getWordBank } from "../../words";
import type { WordBankData, WordEntry } from "../../words";
import { getWordMeaning } from "../../content/word-meanings";
import { colors, spacing, typography, toTamilNumerals } from "../../theme";
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

export function AntaadhiGame({ seed = 0, entries, onComplete }: { seed?: number; entries?: WordEntry[]; onComplete?: () => void }) {
  const mode = "antaadhi";
  const { stage, streak, bestStreak, advance, ready, error: progressError } = useModeProgress(mode);
  const [bank, setBank] = React.useState<WordBankData | null>(null);
  const [game, setGame] = React.useState<AntaadhiState>();
  const [error, setError] = React.useState<string>();
  const [wrongChoice, setWrongChoice] = React.useState<string>();
  const [lastCorrect, setLastCorrect] = React.useState<string>();
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
        game: { ...createAntaadhiState(words, starts[seed % starts.length].w, firstSyllableIndex), bestScore: bestStreak },
      };
    } catch (cause) {
      return { error: String(cause) };
    }
  }, [bestStreak, firstSyllableIndex, seed, words]);
  const activeGame = game ?? generated.game;
  if (!ready) return <ModeLoading error={progressError} />;
  if (!activeGame) return <ModeLoading error={error ?? generated.error} />;
  const gameState = activeGame;
  const currentWord = activeGame.chain[activeGame.chain.length - 1];
  const followers = getAntaadhiFollowers(activeGame.words, currentWord, activeGame.followers)
    .filter((word) => !activeGame.chain.includes(word));
  const validFollowers = new Set(followers);
  const correctChoice = followers[(stage - 1) % Math.max(1, followers.length)];
  const distractors = activeGame.words
    .map((word) => word.w)
    .filter((word) => !validFollowers.has(word) && !activeGame.chain.includes(word));
  const options = correctChoice
    ? [correctChoice, ...Array.from({ length: 3 }, (_, index) => distractors[(stage * 3 + index) % Math.max(1, distractors.length)]).filter((word): word is string => Boolean(word))]
    : [];
  function chooseWord(word: string) {
    const current = game ?? gameState;
    const updated = antaadhiReducer(current, { type: "choose", word });
    if (updated.chain.length === current.chain.length) {
      setWrongChoice(word);
      setTimeout(() => setWrongChoice(undefined), 500);
      return;
    }
    setWrongChoice(undefined);
    setLastCorrect(word);
    if (!onComplete) {
      void advance();
      setGame(antaadhiReducer(updated, { type: "continue" }));
    } else {
      setGame(updated);
    }
  }
  const nextWords = bank && stage >= 20 ? bank.words : activeGame.words;
  const nextIndex = bank && stage >= 20 ? bank.byFirstSyllable : activeGame.followers;
  const starts = eligibleStarts(nextWords, nextIndex);
  const nextStart = starts[stage % Math.max(1, starts.length)]?.w ?? activeGame.chain[0];
  return (
    <GameFrame mode={mode} stage={stage} streak={streak} solved={Boolean(onComplete ? activeGame.solved : followers.length === 0)} error={progressError} onComplete={onComplete} onNext={() => {
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
      <ScrollView horizontal style={styles.chainScroll} contentContainerStyle={styles.chain} showsHorizontalScrollIndicator={false}>
        {activeGame.chain.map((word, index) => (
          <React.Fragment key={`${index}-${word}`}>
            {index > 0 ? <Text style={styles.link}>›</Text> : null}
            <Text style={styles.chainWord}>{word}</Text>
          </React.Fragment>
        ))}
      </ScrollView>
      <Text style={styles.score}>தொடர்: {toTamilNumerals(activeGame.chain.length)} — சிறந்த தொடர்: {toTamilNumerals(activeGame.bestScore + 1)}</Text>
      <View style={styles.options}>
        {options.map((word, index) => (
          <ChoiceButton
            key={`${word}-${index}`}
            label={word}
            selected={wrongChoice === word}
            onPress={() => chooseWord(word)}
          />
        ))}
      </View>
      {wrongChoice ? <Text style={styles.retry}>மீண்டும் முயற்சி செய்யுங்கள்</Text> : null}
      {lastCorrect ? (
        <View style={styles.meaning}>
          <Text style={styles.meaningTitle}>பொருள்: {getWordMeaning(lastCorrect).meaning}</Text>
          <Text style={styles.meaningText}>எடுத்துக்காட்டு: {getWordMeaning(lastCorrect).example}</Text>
        </View>
      ) : null}
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  instruction: { color: colors.sandalCream, fontSize: typography.body, textAlign: "center", marginVertical: spacing.lg },
  chainScroll: { flexGrow: 0, width: "100%" },
  chain: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.sm },
  chainWord: { color: colors.turmeric, fontSize: typography.heading, fontWeight: "700", margin: spacing.xs },
  link: { color: colors.sandalCream, fontSize: typography.heading },
  score: { color: colors.palmLeaf, fontSize: typography.body, marginVertical: spacing.md },
  options: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
  retry: { color: colors.palmLeaf, fontSize: typography.body, marginTop: spacing.sm },
  meaning: { backgroundColor: colors.palmLeaf, borderRadius: 8, padding: spacing.md, marginVertical: spacing.md, maxWidth: 380 },
  meaningTitle: { color: colors.ink, fontSize: typography.body, fontWeight: "800" },
  meaningText: { color: colors.ink, fontSize: typography.label, lineHeight: 26, marginTop: spacing.xs },
});
