import React, { useState } from "react";
import { LevelGame } from "./level/[id]";
import { levels } from "../src/levels";

export default function Kids() {
  const [index, setIndex] = useState(0);
  return (
    <LevelGame
      key={index}
      level={levels[index]}
      kidsMode
      onNext={() => setIndex((current) => (current + 1) % levels.length)}
    />
  );
}
