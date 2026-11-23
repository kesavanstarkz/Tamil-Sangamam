import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { colors, typography, spacing, LampGlow, ScreenHeader } from "../src/theme";
import { levels } from "../src/levels";
import { progressStore } from "../src/state/store";

export default function Daily() {
  const word = useMemo(() => {
    const now = new Date();
    const seed = now.getFullYear() * 372 + (now.getMonth() + 1) * 31 + now.getDate();
    return levels[seed % levels.length];
  }, []);

  return (
    <View style={styles.page}>
      <ScreenHeader title="இன்றைய சொல்" />
      <LampGlow lit />
      <Text style={styles.word}>{word.word}</Text>
      <Text style={styles.streak}>தொடர்: {progressStore.getStreak()}</Text>
      <Pressable style={styles.button} onPress={() => router.push(`/level/${word.id}`)}>
        <Text style={styles.buttonText}>விளையாடு</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.templeMaroon, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  word: { color: colors.turmeric, fontSize: 46, fontWeight: "800", marginVertical: spacing.lg },
  streak: { color: colors.palmLeaf, fontSize: typography.heading },
  button: { minHeight: 56, minWidth: 180, marginTop: spacing.xl, borderRadius: 8, backgroundColor: colors.turmeric, alignItems: "center", justifyContent: "center" },
  buttonText: { color: colors.ink, fontSize: typography.heading, fontWeight: "800" },
});
