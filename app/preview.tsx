import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { PalmLeafTile, CarvedSlot, KolamBorder, LampGlow, InkIcon, colors, typography, spacing } from "../src/theme";
import { parseTile } from "../src/engine";

export default function Preview() {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.title}>வடிவ மாதிரி</Text>
      <KolamBorder width={360} chapter={3} />
      <View style={styles.row}>
        <PalmLeafTile tile={parseTile("க்")} />
        <PalmLeafTile tile={parseTile("அ")} />
        <PalmLeafTile tile={parseTile("க")} highlighted />
      </View>
      <View style={styles.row}>
        <CarvedSlot />
        <CarvedSlot value="க" />
        <CarvedSlot value="டல்" />
      </View>
      <LampGlow lit />
      <View style={styles.row}>
        <InkIcon name="undo" size={36} />
        <InkIcon name="hint" size={36} />
        <InkIcon name="home" size={36} />
        <InkIcon name="settings" size={36} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.templeMaroon },
  content: { alignItems: "center", padding: spacing.lg, gap: spacing.lg },
  title: { color: colors.sandalCream, fontSize: typography.title },
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "center" },
});
