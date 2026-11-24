import React from "react";
import { Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LevelGame } from "../level/[id]";
import { loadEndlessLevel } from "../../src/engine";
import type { LevelDefinition } from "../../src/engine";
import { colors, spacing, typography } from "../../src/theme";

export default function GeneratedPathLevel() {
  const { stage: stageParam = "1" } = useLocalSearchParams<{ stage: string }>();
  const stage = Math.max(1, Number(stageParam) || 1);
  const [level, setLevel] = React.useState<LevelDefinition>();
  const [error, setError] = React.useState<string>();
  React.useEffect(() => {
    let active = true;
    loadEndlessLevel(stage, stage)
      .then((generated) => { if (active) setLevel(generated); })
      .catch((cause: unknown) => { if (active) setError(String(cause)); });
    return () => { active = false; };
  }, [stage]);
  if (!level) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.templeMaroon, alignItems: "center", justifyContent: "center", padding: spacing.lg }}>
        <Text accessibilityRole={error ? "alert" : undefined} style={{ color: colors.sandalCream, fontSize: typography.body, textAlign: "center" }}>
          {error ?? "பயண நிலை தயாராகிறது…"}
        </Text>
      </View>
    );
  }
  return (
    <LevelGame
      key={stage}
      level={level}
      recordStars={false}
      headerTitle={`பயண நிலை ${stage}`}
      onNext={() => router.replace(`/path/${stage + 1}`)}
    />
  );
}
