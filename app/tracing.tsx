import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { colors, ScreenHeader, spacing, typography } from "../src/theme";

const uyir = ["அ","ஆ","இ","ஈ","உ","ஊ","எ","ஏ","ஐ","ஒ","ஓ","ஔ"];
const mei = ["க்","ச்","ட்","த்","ப்","ற்","ங்","ஞ்","ண்","ந்","ம்","ன்","ய்","ர்","ல்","வ்","ழ்","ள்"];

export default function Tracing() {
  const [tab, setTab] = React.useState<"uyir" | "mei">("uyir");
  const letters = tab === "uyir" ? uyir : mei;
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <ScreenHeader title="எழுத்துப் பயிற்சி" />
      <View style={styles.tabs}>
        {(["uyir","mei"] as const).map((value) => (
          <Pressable key={value} onPress={() => setTab(value)} style={[styles.tab, tab === value && styles.active]}>
            <Text style={styles.tabText}>{value === "uyir" ? "உயிர்" : "மெய்"}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.grid}>
        {letters.map((letter) => (
          <Pressable key={letter} accessibilityRole="button" style={styles.cell} onPress={() => router.push({ pathname: "/tracing/[letter]", params: { letter } })}>
            <Text style={styles.letter}>{letter}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.templeMaroon },
  content: { alignItems: "center", padding: spacing.md },
  tabs: { flexDirection: "row", marginVertical: spacing.md },
  tab: { minWidth: 120, minHeight: 48, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.palmLeaf },
  active: { backgroundColor: colors.turmeric },
  tabText: { color: colors.ink, fontSize: typography.body, fontWeight: "800" },
  grid: { width: "100%", flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
  cell: { width: 72, height: 72, margin: 6, borderRadius: 8, backgroundColor: colors.palmLeaf, alignItems: "center", justifyContent: "center" },
  letter: { color: colors.ink, fontSize: typography.title, fontWeight: "800" },
});
