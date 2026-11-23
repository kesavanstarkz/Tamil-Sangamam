import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Tile } from "../engine";
import { toString } from "../engine";
import { colors, radii } from "./tokens";
import { typography } from "./typography";

interface Props {
  tile: Tile;
  selected?: boolean;
  highlighted?: boolean;
  onPress?: () => void;
  size?: "small" | "normal" | "kids";
}

export function PalmLeafTile({ tile, selected, highlighted, onPress, size = "normal" }: Props) {
  const mark = tile.kind === "uyir" ? colors.turmeric : tile.kind === "mei" ? colors.kumkumRed : null;
  const tileSize = size === "kids" ? 76 : size === "small" ? 54 : 64;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={toString(tile)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        {
          width: tileSize,
          height: tileSize,
          transform: [{ rotate: `${((Number(toString(tile).charCodeAt(0) % 3) - 1) * 1.2).toFixed(1)}deg` }],
          borderWidth: tile.kind === "uyirmei" ? 2 : 1,
          borderColor: tile.kind === "uyirmei" ? colors.turmeric : colors.ink,
          opacity: pressed ? 0.78 : 1,
        },
        selected && styles.selected,
        highlighted && styles.highlighted,
      ]}
    >
      {mark ? <View style={[styles.mark, { backgroundColor: mark }]} /> : null}
      <View style={styles.hole} />
      <Text style={[styles.text, size === "kids" && { fontSize: typography.word }]}>{toString(tile)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: "center",
    justifyContent: "center",
    margin: 5,
    borderRadius: radii.tile,
    backgroundColor: colors.palmLeaf,
    shadowColor: colors.ink,
    shadowOffset: { width: 2, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 5,
  },
  text: { color: colors.ink, fontSize: typography.tile, fontWeight: "700" },
  hole: {
    position: "absolute",
    left: 7,
    top: 7,
    width: 5,
    height: 5,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: colors.ink,
  },
  mark: { position: "absolute", right: 7, bottom: 7, width: 7, height: 7, borderRadius: 4 },
  selected: { borderColor: colors.sandalCream, borderWidth: 3 },
  highlighted: { borderColor: colors.lampAmber, borderWidth: 3 },
});
