import React from "react";
import { Text, View } from "react-native";
import { LevelGame } from "./level/[id]";
import { loadEndlessLevel } from "../src/engine";
import type { LevelDefinition } from "../src/engine";
import { endlessProgressStore } from "../src/state/endless";
import { colors, spacing, typography } from "../src/theme";

export default function EndlessMode() {
  const [stage, setStage] = React.useState<number>();
  const [best, setBest] = React.useState(0);
  const [streak, setStreak] = React.useState(0);
  const [level, setLevel] = React.useState<LevelDefinition>();
  const [error, setError] = React.useState<string>();

  React.useEffect(() => {
    let active = true;
    endlessProgressStore.get("build")
      .then((progress) => {
        if (!active) return;
        setStage(progress.stage);
        setBest(progress.bestStreak);
      })
      .catch((cause: unknown) => { if (active) setError(String(cause)); });
    return () => { active = false; };
  }, []);

  React.useEffect(() => {
    if (stage === undefined) return;
    let active = true;
    loadEndlessLevel(stage, stage)
      .then((next) => { if (active) setLevel(next); })
      .catch((cause: unknown) => { if (active) setError(String(cause)); });
    return () => { active = false; };
  }, [stage]);

  if (!level) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.templeMaroon, padding: spacing.lg }}>
        <Text accessibilityRole={error ? "alert" : undefined} style={{ color: colors.sandalCream, fontSize: typography.heading, textAlign: "center" }}>
          {error ?? "சொற்கள் தயாராகின்றன…"}
        </Text>
      </View>
    );
  }

  return (
    <LevelGame
      key={stage}
      level={level}
      recordStars={false}
      headerTitle={`முடிவில்லா முறை · நிலை ${stage}`}
      progressLabel={`சிறந்த தொடர் ${best}`}
      progressError={error}
      onNext={() => { void (async () => {
        const nextStreak = streak + 1;
        try {
          const progress = await endlessProgressStore.recordWin("build", nextStreak);
          setStreak(nextStreak);
          setBest(progress.bestStreak);
          setStage(progress.stage);
          setLevel(undefined);
          setError(undefined);
        } catch (cause) {
          setError(String(cause));
        }
      })(); }}
    />
  );
}
