import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radii } from "./tokens";
import { typography } from "./typography";

export function CarvedSlot({ value }: { value?: string }) {
  return (
    <View style={[styles.slot, Boolean(value) && styles.filled]}>
      {value ? <Text style={styles.text}>{value}</Text> : <View style={styles.groove} />}
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    width: 58,
    height: 64,
    marginHorizontal: 4,
    borderRadius: radii.slot,
    backgroundColor: "#5A3A25",
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  filled: { backgroundColor: "#6D552B", borderColor: colors.turmeric },
  groove: { width: 34, height: 2, backgroundColor: colors.ink, opacity: 0.7 },
  text: { color: colors.sandalCream, fontSize: typography.word, fontWeight: "700" },
});
