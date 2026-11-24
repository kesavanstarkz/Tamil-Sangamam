import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { colors, KolamBorder, typography, spacing, ScreenHeader } from "../src/theme";
import { progressStore } from "../src/state/store";

const chapters = [
  ["தொடக்கம்", "அத்தியாயம் 1"],
  ["பயணம்", "அத்தியாயம் 2"],
  ["நதி", "அத்தியாயம் 3"],
  ["கோயில்", "அத்தியாயம் 4"],
  ["திருவிழா", "அத்தியாயம் 5"],
] as const;

export default function Chapters() {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <ScreenHeader title="சொல் உருவாக்கம்" />
      <Text style={styles.section}>பாடங்கள்</Text>
      {chapters.map(([name, subtitle], index) => {
        const chapter = index + 1;
        const levels = Array.from({ length: 10 }, (_, i) => (chapter - 1) * 10 + i + 1);
        const stars = levels.reduce((total, id) => total + progressStore.getStars(id), 0);
        return (
          <View key={name}>
            <KolamBorder width={360} chapter={chapter} />
            <Pressable style={styles.chapter} onPress={() => router.push(`/chapter/${chapter}`)}>
              <View>
                <Text style={styles.name}>{name}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>
              </View>
              <Text style={styles.stars}>{stars} / 30</Text>
            </Pressable>
          </View>
        );
      })}
      <Text style={styles.section}>தலைப்புகள்</Text>
      {["உறவுகள்","விலங்குகள்","பறவைகள்","பூக்கள்","பழங்கள்","காய்கறிகள்","உணவு","இயற்கை","உடல் உறுப்புகள்","இடங்கள்"].map((topic) => (
        <View key={topic} style={styles.topic}>
          <Text style={styles.name}>{topic}</Text>
          <Text style={styles.stars}>0 / 90</Text>
        </View>
      ))}
      <Text style={styles.section}>முடிவிலி ∞</Text>
      <Pressable style={styles.chapter} onPress={() => router.push("/endless")}>
        <Text style={styles.name}>முடிவிலி ∞</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.templeMaroon },
  content: { padding: spacing.md },
  title: { color: colors.sandalCream, fontSize: typography.title, fontWeight: "800", textAlign: "center", marginBottom: spacing.md },
  chapter: { minHeight: 92, borderRadius: 8, backgroundColor: colors.palmLeaf, borderWidth: 1, borderColor: colors.turmeric, padding: spacing.md, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  name: { color: colors.ink, fontSize: typography.heading, fontWeight: "800" },
  subtitle: { color: colors.ink, fontSize: typography.label, marginTop: 4 },
  stars: { color: colors.kumkumRed, fontSize: typography.heading, fontWeight: "800" },
  section: { color: colors.turmeric, fontSize: typography.heading, fontWeight: "800", marginTop: spacing.lg, marginBottom: spacing.sm },
  topic: { minHeight: 72, marginVertical: spacing.xs, borderRadius: 8, borderWidth: 1, borderColor: colors.palmLeaf, backgroundColor: "#541820", padding: spacing.md, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
