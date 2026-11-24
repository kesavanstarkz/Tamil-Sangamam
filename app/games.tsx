import React from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { router } from "expo-router";
import { MODE_TITLES, GameMode } from "../src/screens/games/common";
import { colors, KolamBorder, ScreenHeader, spacing, typography } from "../src/theme";

const modes: GameMode[] = ["missing", "unscramble", "letter-lab", "antaadhi", "word-search"];

export default function GamesHub() {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <ScreenHeader title="விளையாட்டுகள்" />
      <KolamBorder width={320} />
      <Text style={styles.subtitle}>ஒரு விளையாட்டைத் தேர்ந்தெடுக்கவும்</Text>
      {modes.map((mode) => (
        <Pressable
          accessibilityRole="button"
          key={mode}
          style={styles.card}
          onPress={() => router.push(`/game/${mode}`)}
        >
          <Text style={styles.title}>{MODE_TITLES[mode]}</Text>
          <Text style={styles.arrow}>தொடங்கு ›</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.templeMaroon },
  content: { alignItems: "center", padding: spacing.md, paddingBottom: spacing.xl },
  subtitle: { color: colors.palmLeaf, fontSize: typography.body, marginVertical: spacing.md },
  card: {
    width: "100%",
    maxWidth: 420,
    minHeight: 68,
    marginVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.palmLeaf,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#541820",
  },
  title: { color: colors.sandalCream, fontSize: typography.body, fontWeight: "700" },
  arrow: { color: colors.turmeric, fontSize: typography.label },
});
