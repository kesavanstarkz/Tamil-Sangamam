import React from "react";
import Svg, { Ellipse, Path } from "react-native-svg";
import { colors } from "./tokens";

export function LampGlow({ lit = false }: { lit?: boolean }) {
  return (
    <Svg width={88} height={72} viewBox="0 0 88 72" pointerEvents="none">
      {lit ? (
        <Ellipse cx={44} cy={25} rx={18} ry={24} fill={colors.lampAmber} opacity={0.26} />
      ) : null}
      {lit ? <Path d="M44 42 C31 34 35 17 44 6 C53 17 57 34 44 42Z" fill={colors.lampAmber} /> : null}
      <Path d="M18 58 C18 41 70 41 70 58 C70 68 18 68 18 58Z" fill={colors.palmLeaf} stroke={colors.ink} strokeWidth={2} />
      <Ellipse cx={44} cy={58} rx={26} ry={10} fill={colors.templeMaroon} stroke={colors.turmeric} strokeWidth={1} />
    </Svg>
  );
}
