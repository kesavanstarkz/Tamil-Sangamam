import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { colors, LampGlow, ScreenHeader, spacing, typography } from "../../src/theme";
import { scoreTrace } from "../../src/engine";

export default function TraceLetter() {
  const { letter } = useLocalSearchParams<{ letter: string }>();
  const [points, setPoints] = React.useState(0);
  const [stars, setStars] = React.useState(0);
  function clear() { setPoints(0); setStars(0); }
  function trace() {
    const next = points + 1;
    setPoints(next);
    setStars(scoreTrace(Array.from({ length: 100 }, (_, i) => ({ x: i, y: i })), 2, next));
  }
  return (
    <View style={styles.page}>
      <ScreenHeader title="எழுத்துப் பயிற்சி" />
      <Text style={styles.name}>{letter}</Text>
      <Pressable accessibilityRole="button" testID="sand-tray" style={styles.tray} onPress={trace}>
        <Text style={styles.ghost}>{letter}</Text>
      </Pressable>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" style={styles.action} onPress={clear}><Text style={styles.actionText}>மீண்டும்</Text></Pressable>
        <Pressable accessibilityRole="button" style={styles.action} onPress={() => setStars((current) => current || 1)}><Text style={styles.actionText}>முடிந்தது</Text></Pressable>
      </View>
      <LampGlow lit={stars > 0} />
      {stars > 0 ? <Text style={styles.stars}>{stars} / 3</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.templeMaroon, alignItems: "center", padding: spacing.md },
  name: { color: colors.turmeric, fontSize: typography.title, marginVertical: spacing.sm },
  tray: { width: "92%", height: 360, maxWidth: 420, borderRadius: 16, backgroundColor: "#C9A66B", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.palmLeaf },
  ghost: { color: "rgba(242,230,200,0.45)", fontSize: 220, fontWeight: "800" },
  actions: { width: "92%", flexDirection: "row", justifyContent: "space-between", marginTop: spacing.md },
  action: { minWidth: 140, minHeight: 52, borderRadius: 8, backgroundColor: colors.palmLeaf, alignItems: "center", justifyContent: "center" },
  actionText: { color: colors.ink, fontSize: typography.body, fontWeight: "800" },
  stars: { color: colors.turmeric, fontSize: typography.heading, fontWeight: "800" },
});
