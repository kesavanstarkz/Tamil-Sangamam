import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { colors, typography, spacing, ScreenHeader } from "../../src/theme";
import { getChapterLevels } from "../../src/levels";
import { progressStore } from "../../src/state/store";

export default function ChapterLevels() {
  const params = useLocalSearchParams<{ chapter: string }>();
  const chapter = Number(params.chapter);
  const chapterLevels = getChapterLevels(chapter);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <ScreenHeader title={`அத்தியாயம் ${chapter}`} />
      <View style={styles.grid}>
        {chapterLevels.map((level) => (
          <Pressable key={level.id} style={styles.level} onPress={() => router.push(`/level/${level.id}`)}>
            <Text style={styles.number}>{level.id}</Text>
            <Text style={styles.word}>{level.word}</Text>
            <Text style={styles.stars}>{`${progressStore.getStars(level.id)} / 3`}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.templeMaroon },
  content: { padding: spacing.md },
  title: { color: colors.sandalCream, fontSize: typography.title, textAlign: "center", marginBottom: spacing.md },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
  level: { width: 96, height: 96, margin: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.turmeric, backgroundColor: colors.palmLeaf, alignItems: "center", justifyContent: "center" },
  number: { color: colors.ink, fontSize: typography.small },
  word: { color: colors.ink, fontSize: typography.body, fontWeight: "800" },
  stars: { color: colors.kumkumRed, fontSize: typography.small, minHeight: 18 },
});
