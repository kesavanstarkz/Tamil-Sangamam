import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, KolamBorder, LampGlow, ScreenHeader, spacing, typography } from "../../theme";
import { endlessProgressStore } from "../../state/endless";

export type GameMode = "missing" | "unscramble" | "letter-lab" | "antaadhi" | "word-search";

export const MODE_TITLES: Record<GameMode, string> = {
  missing: "விடுபட்ட எழுத்து",
  unscramble: "கலைந்த சொல்",
  "letter-lab": "எழுத்துக் கூடம்",
  antaadhi: "அந்தாதி",
  "word-search": "சொல் தேடல்",
};

export function useModeProgress(mode: GameMode) {
  const [stage, setStage] = React.useState(1);
  const [streak, setStreak] = React.useState(0);
  const [ready, setReady] = React.useState(false);
  const [error, setError] = React.useState<string>();

  React.useEffect(() => {
    let active = true;
    endlessProgressStore.get(mode)
      .then((progress) => {
        if (!active) return;
        setStage(progress.stage);
        setReady(true);
      })
      .catch((cause: unknown) => {
        if (active) setError(String(cause));
      });
    return () => { active = false; };
  }, [mode]);

  const advance = React.useCallback(async (): Promise<boolean> => {
    setError(undefined);
    try {
      const progress = await endlessProgressStore.recordWin(mode, streak + 1);
      setStreak((current) => current + 1);
      setStage(progress.stage);
      return true;
    } catch (cause) {
      setError(String(cause));
      return false;
    }
  }, [mode, streak]);
  return { stage, streak, advance, ready, error };
}

export function GameFrame({
  mode,
  stage,
  streak,
  solved,
  onNext,
  error,
  children,
}: {
  mode: GameMode;
  stage: number;
  streak: number;
  solved: boolean;
  onNext: () => void;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <ScreenHeader title={MODE_TITLES[mode]} />
      <Text style={styles.stage}>நிலை {stage}</Text>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      {children}
      <LampGlow lit={solved && streak >= 2} />
      {solved ? (
        <View style={styles.result}>
          <KolamBorder width={300} chapter={stage} />
          <Text accessibilityRole="alert" style={styles.success}>வெற்றி!</Text>
          {streak >= 2 ? <Text style={styles.streak}>தொடர் வெற்றி · {streak + 1}</Text> : null}
          <Pressable accessibilityRole="button" style={styles.next} onPress={onNext}>
            <Text style={styles.nextText}>அடுத்த நிலை →</Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}

export function ModeLoading({ error }: { error?: string }) {
  return (
    <View style={styles.loading}>
      <Text accessibilityRole={error ? "alert" : undefined} style={styles.loadingText}>
        {error ?? "சொற்கள் தயாராகின்றன…"}
      </Text>
    </View>
  );
}

export function ChoiceButton({
  label,
  onPress,
  testID,
  selected,
}: {
  label: string;
  onPress: () => void;
  testID?: string;
  selected?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
      style={[styles.choice, selected && { borderWidth: 3, borderColor: colors.turmeric }]}
      onPress={onPress}
    >
      <Text style={styles.choiceText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.templeMaroon },
  content: { alignItems: "center", padding: spacing.md, minHeight: 700 },
  stage: { color: colors.palmLeaf, fontSize: typography.label, marginVertical: spacing.sm },
  result: { alignItems: "center", marginTop: spacing.sm },
  success: { color: colors.turmeric, fontSize: typography.title, fontWeight: "800" },
  streak: { color: colors.sandalCream, fontSize: typography.body, marginTop: spacing.xs },
  next: {
    minHeight: 52,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    backgroundColor: colors.turmeric,
    alignItems: "center",
    justifyContent: "center",
  },
  nextText: { color: colors.ink, fontSize: typography.body, fontWeight: "800" },
  choice: {
    minWidth: 76,
    minHeight: 56,
    margin: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.palmLeaf,
    alignItems: "center",
    justifyContent: "center",
  },
  choiceText: { color: colors.ink, fontSize: typography.heading, fontWeight: "700" },
  loading: {
    flex: 1,
    backgroundColor: colors.templeMaroon,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  loadingText: { color: colors.sandalCream, fontSize: typography.heading, textAlign: "center" },
  error: { color: colors.turmeric, fontSize: typography.label, textAlign: "center", marginVertical: spacing.xs },
});
