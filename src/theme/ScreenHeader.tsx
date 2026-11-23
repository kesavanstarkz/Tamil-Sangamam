import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { colors } from "./tokens";
import { typography } from "./typography";

interface Props {
  title: string;
  back?: boolean;
}

export function ScreenHeader({ title, back = true }: Props) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={back ? "திரும்பு" : "முகப்பு"}
        onPress={() => (back ? router.back() : router.push("/"))}
        style={styles.action}
      >
        <Text style={styles.back}>{back ? "‹" : "⌂"}</Text>
      </Pressable>
      <Text numberOfLines={1} style={styles.title}>
        {title}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="அமைப்புகள்"
        onPress={() => router.push("/settings")}
        style={styles.action}
      >
        <Svg width={25} height={25} viewBox="0 0 24 24">
          <Path
            d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7m10 10 2.1 2.1m0-14.2L17 7M7 17l-2.1 2.1"
            stroke={colors.sandalCream}
            strokeWidth={1.8}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: "100%",
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  action: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  back: { color: colors.sandalCream, fontSize: 34, lineHeight: 38 },
  title: {
    color: colors.sandalCream,
    fontSize: typography.heading,
    fontWeight: "800",
    flex: 1,
    textAlign: "center",
  },
});
