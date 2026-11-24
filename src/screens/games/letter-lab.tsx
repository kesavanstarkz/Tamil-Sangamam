import React from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  createClassifyQuestion,
  createSplitQuestion,
  letterLabReducer,
  LETTER_CLASSES,
  NATIVE_MEIS,
  VOWEL_NAMES,
} from "../../engine";
import type { LetterLabQuestion, LetterLabState } from "../../engine/letter-lab";
import { colors, spacing, typography } from "../../theme";
import { ChoiceButton, GameFrame, useModeProgress } from "./common";

function questionForStage(stage: number): LetterLabQuestion {
  return stage % 3 === 0
    ? createClassifyQuestion(`${NATIVE_MEIS[((stage / 3) - 1) % NATIVE_MEIS.length]}்`)
    : createSplitQuestion(NATIVE_MEIS[(stage - 1) % NATIVE_MEIS.length], (stage - 1) % VOWEL_NAMES.length);
}

export function LetterLabGame({ seed = 0 }: { seed?: number }) {
  const mode = "letter-lab";
  const { stage, streak, advance, ready, error: progressError } = useModeProgress(mode);
  const [game, setGame] = React.useState<LetterLabState>();
  const [selectedMei, setSelectedMei] = React.useState<string>();
  const [selectedUyir, setSelectedUyir] = React.useState<string>();
  const activeGame = game ?? { question: questionForStage(stage + seed), solved: false };
  function answerSplit(mei: string, uyir: string) {
    setGame((current) => letterLabReducer(current ?? activeGame, { type: "answer-split", mei, uyir }));
  }
  function answerClass(category: keyof typeof LETTER_CLASSES) {
    setGame((current) => letterLabReducer(current ?? activeGame, { type: "answer-class", category }));
  }
  if (!ready) return <GameLoading error={progressError} />;
  return (
    <GameFrame mode={mode} stage={stage} streak={streak} solved={activeGame.solved} error={progressError} onNext={() => {
      void advance().then((saved) => {
        if (!saved) return;
        setGame(undefined);
        setSelectedMei(undefined);
        setSelectedUyir(undefined);
      });
    }}>
      <Text style={styles.instruction}>
        {activeGame.question.kind === "split" ? "பிரி · எழுத்தைப் பிரிக்கவும்" : "இனம் · மெய்யின் வகையைத் தேர்ந்தெடுக்கவும்"}
      </Text>
      <Text style={styles.prompt}>{activeGame.question.prompt}</Text>
      {activeGame.question.kind === "split" ? (
        <View style={styles.options}>
          <Text style={styles.label}>மெய்</Text>
          {(stage < 6 ? NATIVE_MEIS.slice(0, 6) : NATIVE_MEIS).map((base) => {
            const mei = `${base}்`;
            return (
              <ChoiceButton
                key={mei}
                label={mei}
                testID={`lab-mei-${mei}`}
                selected={selectedMei === mei}
                onPress={() => {
                  setSelectedMei(mei);
                  if (selectedUyir) answerSplit(mei, selectedUyir);
                }}
              />
            );
          })}
          <Text style={styles.label}>உயிர்</Text>
          {(stage < 6 ? VOWEL_NAMES.slice(0, 6) : VOWEL_NAMES).map((uyir) => (
            <ChoiceButton
              key={uyir}
              label={uyir}
              testID={`lab-uyir-${uyir}`}
              selected={selectedUyir === uyir}
              onPress={() => {
                setSelectedUyir(uyir);
                if (selectedMei) answerSplit(selectedMei, uyir);
              }}
            />
          ))}
        </View>
      ) : (
        <View style={styles.options}>
          {(Object.keys(LETTER_CLASSES) as (keyof typeof LETTER_CLASSES)[]).map((category) => (
            <ChoiceButton key={category} label={category} testID={`lab-class-${category}`} onPress={() => answerClass(category)} />
          ))}
        </View>
      )}
    </GameFrame>
  );
}

function GameLoading({ error }: { error?: string }) {
  return (
    <View style={styles.loading}>
      <Text accessibilityRole={error ? "alert" : undefined} style={styles.loadingText}>
        {error ?? "நிலை தயாராகிறது…"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  instruction: { color: colors.sandalCream, fontSize: typography.body, textAlign: "center", marginTop: spacing.lg },
  prompt: { color: colors.turmeric, fontSize: typography.title, fontWeight: "800", margin: spacing.md },
  options: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
  label: { width: "100%", color: colors.palmLeaf, fontSize: typography.label, textAlign: "center", marginTop: spacing.sm },
  loading: { flex: 1, backgroundColor: colors.templeMaroon, alignItems: "center", justifyContent: "center" },
  loadingText: { color: colors.sandalCream, fontSize: typography.heading, textAlign: "center" },
});
