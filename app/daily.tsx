import React from "react";
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import kural from "../src/content/kural.json";
import { LevelGame } from "./level/[id]";
import { AntaadhiGame } from "../src/screens/games/antaadhi";
import { LetterLabGame } from "../src/screens/games/letter-lab";
import { MissingLetterGame } from "../src/screens/games/missing-letter";
import { UnscrambleGame } from "../src/screens/games/unscramble";
import { WordSearchGame } from "../src/screens/games/word-search";
import { getDailyDifficulty, getDailyPuzzles, getDailySeed } from "../src/engine";
import { levels } from "../src/levels";
import { progressStore } from "../src/state/store";
import { colors, LampGlow, ScreenHeader, spacing, typography, toTamilNumerals } from "../src/theme";

function localDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const puzzleNames = ["சொல் உருவாக்கம்", "விடுபட்ட எழுத்து", "கலைந்த சொல்", "எழுத்துக் கூடம்", "அந்தாதி / சொல் தேடல்"];

export default function Daily() {
  const date = localDateString(new Date());
  const puzzles = getDailyPuzzles(date);
  const [done, setDone] = React.useState<boolean[]>([false, false, false, false, false]);
  const [activeStep, setActiveStep] = React.useState<number | null>(null);
  const [ready, setReady] = React.useState(false);
  const [error, setError] = React.useState<string>();
  const kuralDay = kural[Number(date.slice(-2)) % kural.length] ?? kural[0];
  const completed = done.filter(Boolean).length;
  const allDone = completed === 5;

  React.useEffect(() => {
    let active = true;
    progressStore.hydrate()
      .then(() => {
        if (!active) return;
        setDone(progressStore.getDailySteps(date));
        setReady(true);
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(String(cause));
          setReady(true);
        }
      });
    return () => { active = false; };
  }, [date]);

  function completeStep(index: number) {
    const updated = [...done];
    updated[index] = true;
    progressStore.setDailySteps(date, updated);
    if (!done.every(Boolean) && updated.every(Boolean)) {
      progressStore.setStreak(progressStore.getStreak() + 1);
    }
    setDone(updated);
    setActiveStep(null);
  }

  async function shareDay() {
    try {
      await Share.share({
        message: `தமிழ் சங்கமம் – ${date.split("-").reverse().join("-")}\n🪔🪔🪔🪔🪔\n5/5 · தொடர் ${toTamilNumerals(progressStore.getStreak())} நாள்`,
      });
    } catch (cause) {
      setError(String(cause));
    }
  }

  if (!ready) {
    return <View style={styles.center}><Text style={styles.body}>இன்றைய சவால் தயாராகிறது…</Text></View>;
  }
  if (activeStep !== null) {
    const mode = puzzles[activeStep];
    const seed = getDailySeed(date, activeStep);
    const onComplete = () => completeStep(activeStep);
    if (mode === "word-build") {
      return (
        <View style={styles.game}>
          <LevelGame level={levels[seed % levels.length]} recordStars={false} headerTitle="இன்றைய சவால்" onNext={onComplete} />
        </View>
      );
    }
    if (mode === "missing") return <MissingLetterGame key={`${date}-${activeStep}`} seed={seed} onComplete={onComplete} />;
    if (mode === "unscramble") return <UnscrambleGame key={`${date}-${activeStep}`} seed={seed} onComplete={onComplete} />;
    if (mode === "letter-lab") return <LetterLabGame key={`${date}-${activeStep}`} seed={seed} onComplete={onComplete} />;
    if (mode === "antaadhi") return <AntaadhiGame key={`${date}-${activeStep}`} seed={seed} onComplete={onComplete} />;
    return <WordSearchGame key={`${date}-${activeStep}`} seed={seed} onComplete={onComplete} />;
  }
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <ScreenHeader title="இன்றைய சவால்" />
      <Text style={styles.date}>{date}</Text>
      <Text style={styles.difficulty}>வார நாள் நிலை {toTamilNumerals(getDailyDifficulty(date))}</Text>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <View style={styles.steps}>
        {puzzles.map((mode, index) => (
          <Pressable
            key={`${mode}-${index}`}
            accessibilityRole="button"
            accessibilityLabel={`${puzzleNames[index]}${done[index] ? " முடிந்தது" : ""}`}
            style={({ pressed }) => [styles.step, pressed && styles.pressed]}
            onPress={() => setActiveStep(index)}
          >
            <LampGlow lit={done[index]} />
            <Text style={styles.stepName}>{puzzleNames[index]}</Text>
            <Text style={styles.stepStatus}>{done[index] ? "முடிந்தது" : "தொடங்கு"}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.progress}>{toTamilNumerals(completed)}/௫ முடிந்தது</Text>
      {allDone ? (
        <View style={styles.complete}>
          <LampGlow lit />
          <Text style={styles.completeTitle}>இன்றைய சவால் நிறைவு!</Text>
          <Text style={styles.body}>தொடர் {toTamilNumerals(progressStore.getStreak())} நாள்</Text>
          <Text style={styles.kural}>குறள் {toTamilNumerals(kuralDay.number)}</Text>
          <Text style={styles.kuralText}>{kuralDay.text}</Text>
          <Pressable accessibilityRole="button" style={styles.share} onPress={() => { void shareDay(); }}>
            <Text style={styles.shareText}>பகிர்</Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.templeMaroon },
  content: { alignItems: "center", padding: spacing.md, paddingBottom: spacing.xl },
  center: { flex: 1, backgroundColor: colors.templeMaroon, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  game: { flex: 1 },
  date: { color: colors.sandalCream, fontSize: typography.body, marginTop: spacing.md },
  difficulty: { color: colors.palmLeaf, fontSize: typography.label, marginVertical: spacing.xs },
  steps: { width: "100%", maxWidth: 440, marginTop: spacing.md },
  step: { minHeight: 82, borderWidth: 1, borderColor: colors.palmLeaf, borderRadius: 8, backgroundColor: "#541820", marginVertical: spacing.xs, paddingHorizontal: spacing.sm, flexDirection: "row", alignItems: "center" },
  pressed: { opacity: 0.75 },
  stepName: { flex: 1, color: colors.sandalCream, fontSize: typography.body, fontWeight: "700" },
  stepStatus: { color: colors.turmeric, fontSize: typography.label, marginRight: spacing.sm },
  progress: { color: colors.turmeric, fontSize: typography.heading, marginTop: spacing.md },
  complete: { width: "100%", maxWidth: 420, alignItems: "center", marginTop: spacing.lg, padding: spacing.md },
  completeTitle: { color: colors.turmeric, fontSize: typography.heading, fontWeight: "800", textAlign: "center" },
  body: { color: colors.sandalCream, fontSize: typography.body, textAlign: "center" },
  kural: { color: colors.palmLeaf, fontSize: typography.label, marginTop: spacing.md },
  kuralText: { color: colors.sandalCream, fontSize: typography.body, textAlign: "center", lineHeight: 30, marginVertical: spacing.md },
  share: { minWidth: 140, minHeight: 52, borderRadius: 8, backgroundColor: colors.turmeric, alignItems: "center", justifyContent: "center" },
  shareText: { color: colors.ink, fontSize: typography.body, fontWeight: "800" },
  error: { color: colors.turmeric, fontSize: typography.label, textAlign: "center" },
});
