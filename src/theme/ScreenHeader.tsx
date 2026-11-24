import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import Svg, { Circle, Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "./tokens";
import { typography } from "./typography";

interface Props {
  title: string;
  back?: boolean;
}

export function ScreenHeader({ title, back = true }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={back ? "திரும்பு" : "முகப்பு"}
        onPress={() => (back ? router.back() : router.push("/"))}
        style={styles.action}
      >
        <Text style={styles.back}>{back ? "‹" : "⌂"}</Text>
      </Pressable>
      <Text numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.82} style={styles.title}>
        {title}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="அமைப்புகள்"
        onPress={() => router.push("/settings")}
        style={styles.action}
      >
        <Svg width={25} height={25} viewBox="0 0 24 24">
          <Circle cx={12} cy={12} r={3} fill="none" stroke={colors.sandalCream} strokeWidth={1.8} />
          <Path
            d="M9.7 2h4.6l.7 2.4 2.1 1.2 2.4-.8 2.3 4-1.7 1.8.1 2.4 1.6 1.9-2.3 4-2.4-.8-2.1 1.2-.7 2.7H9.7l-.7-2.7-2.1-1.2-2.4.8-2.3-4 1.6-1.9.1-2.4-1.7-1.8 2.3-4 2.4.8 2.1-1.2Z"
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
