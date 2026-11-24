import React from "react";
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import kural from "../src/content/kural.json";
import { getDailyPuzzles, getDailyDifficulty } from "../src/engine";
import { progressStore } from "../src/state/store";
import { colors, LampGlow, ScreenHeader, spacing, typography, toTamilNumerals } from "../src/theme";

export default function Daily() {
  const date = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()).replaceAll("/", "-");
  const puzzles = getDailyPuzzles(date);
  const [completed] = React.useState(progressStore.getDaily(date));
  const kuralDay = kural[Number(date.slice(-2)) % kural.length];

  function openPuzzle(index: number) {
    if (index > completed) return;
    const mode = puzzles[index];
    if (mode === "word-build") router.push("/chapters");
    else router.push(`/game/${mode === "missing" ? "missing" : mode === "unscramble" ? "unscramble" : mode === "letter-lab" ? "letter-lab" : mode}`);
  }
  async function shareDay() {
    await Share.share({ message: `தமிழ் சங்கமம் – ${date.split("-").reverse().join("-")}\n🪔🪔🪔🪔🪔\n5/5 · தொடர் ${toTamilNumerals(progressStore.getStreak())} நாள்` });
  }
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <ScreenHeader title="இன்றைய சவால்" />
      <Text style={styles.date}>{date} · நிலை {toTamilNumerals(getDailyDifficulty(date))}</Text>
      <View style={styles.lamps}>
        {puzzles.map((mode, index) => (
          <Pressable key={mode} accessibilityRole="button" onPress={() => openPuzzle(index)} style={styles.lamp}>
            <LampGlow lit={index < completed} />
          </Pressable>
        ))}
      </View>
      {completed >= 5 ? (
        <View style={styles.complete}>
          <LampGlow lit />
          <Text style={styles.completeTitle}>வெற்றி!</Text>
          <Text style={styles.kural}>குறள் {kuralDay.number}</Text>
          <Text style={styles.kuralText}>{kuralDay.text}</Text>
          <Pressable accessibilityRole="button" style={styles.share} onPress={shareDay}>
            <Text style={styles.shareText}>பகிர்</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={styles.progress}>{completed}/5 முடிந்தது</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.templeMaroon },
  content: { alignItems: "center", padding: spacing.md, minHeight: 680 },
  date: { color: colors.sandalCream, fontSize: typography.body, marginVertical: spacing.md },
  lamps: { width: "100%", flexDirection: "row", justifyContent: "space-between" },
  lamp: { width: 64, height: 64, alignItems: "center", justifyContent: "center" },
  progress: { color: colors.turmeric, fontSize: typography.heading, marginTop: spacing.xl },
  complete: { alignItems: "center", marginTop: spacing.lg },
  completeTitle: { color: colors.turmeric, fontSize: typography.title, fontWeight: "800" },
  kural: { color: colors.palmLeaf, fontSize: typography.label, marginTop: spacing.md },
  kuralText: { color: colors.sandalCream, fontSize: typography.body, textAlign: "center", lineHeight: 30, marginVertical: spacing.md },
  share: { minWidth: 140, minHeight: 52, borderRadius: 8, backgroundColor: colors.turmeric, alignItems: "center", justifyContent: "center" },
  shareText: { color: colors.ink, fontSize: typography.body, fontWeight: "800" },
});
