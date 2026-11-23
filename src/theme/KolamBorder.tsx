import React from "react";
import Svg, { Circle, Path } from "react-native-svg";
import { colors } from "./tokens";

export function KolamBorder({ width = 360, chapter = 1 }: { width?: number; chapter?: number }) {
  const step = 36;
  const dots = Array.from({ length: Math.ceil(width / step) + 1 }, (_, index) => index);
  return (
    <Svg width={width} height={42} viewBox={`0 0 ${width} 42`} pointerEvents="none">
      {dots.map((index) => (
        <React.Fragment key={index}>
          <Circle cx={index * step} cy={21} r={2.2} fill={colors.turmeric} />
          {index < dots.length - 1 ? (
            <Path
              d={`M ${index * step} 21 Q ${index * step + step / 2} ${chapter % 2 ? 5 : 37} ${(index + 1) * step} 21`}
              stroke={colors.kumkumRed}
              strokeWidth={1.5}
              fill="none"
            />
          ) : null}
        </React.Fragment>
      ))}
    </Svg>
  );
}
