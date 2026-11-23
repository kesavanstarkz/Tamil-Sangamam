import React from "react";
import Svg, { Path } from "react-native-svg";
import { colors } from "./tokens";

type Name = "undo" | "hint" | "home" | "settings";

export function InkIcon({
  name,
  size = 28,
  color = colors.sandalCream,
}: {
  name: Name;
  size?: number;
  color?: string;
}) {
  const paths: Record<Name, string> = {
    undo: "M20 10H9a7 7 0 1 0 7 7M20 10l-6-6M20 10l-6 6",
    hint: "M12 3a7 7 0 0 0-4 12c1 1 1 3 1 4h6c0-1 0-3 1-4a7 7 0 0 0-4-12ZM9 22h6",
    home: "M3 11L12 3l9 8M5 9v12h14V9M9 21v-7h6v7",
    settings: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v3M12 19v3M2 12h3M19 12h3",
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={paths[name]} stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}
