import React, { useMemo, useRef, useState } from "react";
import {
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { GestureResponderEvent } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { levels } from "../../src/levels";
import {
  getHint,
  initLevel,
  isDeadEnd,
  isWon,
  mergeTiles,
  placeTile,
  restart,
  tileEquals,
  toString,
  undo,
} from "../../src/engine";
import type { GameHint, GameState } from "../../src/engine";
import { playMergeSound, playTap, playTileSound } from "../../src/audio/soundManager";
import { progressStore, settingsStore } from "../../src/state/store";
import {
  CarvedSlot,
  colors,
  InkIcon,
  KolamBorder,
  LampGlow,
  PalmLeafTile,
  ScreenHeader,
  spacing,
  typography,
} from "../../src/theme";
import Svg, { Circle, Path, Rect } from "react-native-svg";

interface LevelGameProps {
  level: (typeof levels)[number];
  kidsMode?: boolean;
  showHeader?: boolean;
  headerTitle?: string;
  progressLabel?: string;
  progressError?: string;
  recordStars?: boolean;
  onNext?: () => void;
}

export function LevelGame({
  level,
  kidsMode = false,
  showHeader = true,
  headerTitle,
  progressLabel,
  progressError,
  recordStars = true,
  onNext,
}: LevelGameProps) {
  const [game, setGame] = useState<GameState>(() => initLevel(level, { kidsMode }));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hint, setHint] = useState<GameHint | null>(null);
  const slotRefs = useRef<(React.ElementRef<typeof View> | null)[]>([]);

  const won = isWon(game);

  function updateGame(update: (current: GameState) => GameState): void {
    setGame(update);
    setHint(null);
  }

  React.useEffect(() => {
    if (!won || kidsMode || !recordStars) return;
    const hintsUsed = 3 - game.hintsLeft;
    const totalErrors = game.mistakes + hintsUsed;
    progressStore.setStars(level.id, totalErrors === 0 ? 3 : totalErrors <= 2 ? 2 : 1);
  }, [game.hintsLeft, game.mistakes, kidsMode, level.id, recordStars, won]);

  async function onTilePress(tileId: string): Promise<void> {
    await playTap(settingsStore.getHaptics());
    if (kidsMode) {
      const entry = game.pool.find((item) => item.id === tileId);
      if (entry) await playTileSound(toString(entry.tile));
    }

    if (selectedId === null) {
      setSelectedId(tileId);
      return;
    }
    if (selectedId === tileId) {
      setSelectedId(null);
      return;
    }

    let merged = false;
    updateGame((current) => {
      const before = current.history.length;
      const next = mergeTiles(current, selectedId, tileId);
      merged = next.history.length > before;
      return next;
    });
    setSelectedId(null);
    if (merged) await playMergeSound(settingsStore.getSound());
  }

  function place(tileId: string, slotIndex = game.slots.findIndex((slot) => slot === null)): void {
    if (slotIndex < 0) return;
    const nextSlot = game.slots.findIndex((slot) => slot === null);
    const entry = game.pool.find((item) => item.id === tileId);
    const willPlace =
      slotIndex === nextSlot &&
      entry !== undefined &&
      tileEquals(entry.tile, game.target[nextSlot]);
    updateGame((current) => placeTile(current, tileId, slotIndex));
    setSelectedId(null);
    if (willPlace) void playMergeSound(settingsStore.getSound());
  }

  function dropOnSlot(tileId: string, event: GestureResponderEvent): void {
    const { pageX, pageY } = event.nativeEvent;
    slotRefs.current.forEach((slot, index) => {
      slot?.measureInWindow((x: number, y: number, width: number, height: number) => {
        if (pageX >= x && pageX <= x + width && pageY >= y && pageY <= y + height) {
          place(tileId, index);
        }
      });
    });
  }

  function useHint(): void {
    const result = getHint(game);
    setGame(result.state);
    setHint(result.hint);
  }

  function onUndo(): void {
    updateGame(undo);
    setSelectedId(null);
  }

  function onRestart(): void {
    setGame(restart(game));
    setSelectedId(null);
    setHint(null);
  }

  const deadEnd = isDeadEnd(game);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      {showHeader ? <ScreenHeader title={headerTitle ?? (kidsMode ? "குழந்தைகள் முறை" : `நிலை ${level.id}`)} /> : null}
      {progressLabel ? <Text style={styles.progressLabel}>{progressLabel}</Text> : null}
      {progressError ? <Text accessibilityRole="alert" style={styles.progressError}>{progressError}</Text> : null}
      {!showHeader ? <Text style={styles.title}>{level.word}</Text> : null}

      {kidsMode ? (
        <View style={styles.pictureClue}>
          <View style={styles.pictureFrame} pointerEvents="none">
            <Svg width={78} height={56} viewBox="0 0 78 56">
              <Rect x={5} y={38} width={68} height={10} rx={2} fill={colors.bananaLeafGreen} />
              <Path d="M39 40 C20 32 22 17 39 5 C56 17 58 32 39 40Z" fill={colors.turmeric} />
              <Circle cx={39} cy={27} r={8} fill={colors.kumkumRed} />
            </Svg>
          </View>
          <Text style={styles.pictureText}>படக் குறிப்பு · {level.hint}</Text>
        </View>
      ) : null}

      <Text style={styles.word}>{level.word}</Text>
      <View style={styles.slots}>
        {game.target.map((target, index) => (
          <Pressable
            key={`slot-${index}`}
            accessibilityRole="button"
            accessibilityLabel={
              game.slots[index]
                ? `இடம் ${index + 1} நிரம்பியது ${toString(game.slots[index]!)}`
                : `இடம் ${index + 1} காலி`
            }
            testID={`slot-${index}`}
            onPress={() => {
              if (selectedId) place(selectedId, index);
            }}
          >
            <View
              ref={(ref) => {
                slotRefs.current[index] = ref;
              }}
              collapsable={false}
            >
              <CarvedSlot value={game.slots[index] ? toString(game.slots[index]!) : undefined} />
            </View>
          </Pressable>
        ))}
      </View>

      <LampGlow lit={won} />
      {won ? (
        <View style={styles.success}>
          <KolamBorder width={300} chapter={level.chapter} />
          <Text style={styles.successText}>வெற்றி!</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="அடுத்த நிலை"
            style={styles.nextButton}
            onPress={() => {
              if (onNext) onNext();
              else if (level.id < levels.length) router.replace(`/level/${level.id + 1}`);
              else router.replace("/chapters");
            }}
          >
            <Text style={styles.nextText}>அடுத்த நிலை →</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.board}>
        {game.pool.map(({ id, tile }) => (
            <DraggableTile key={id} tileId={id} onDrop={dropOnSlot}>
              <View style={styles.tileWrap}>
              <PalmLeafTile
                tile={tile}
                size={kidsMode ? "kids" : "normal"}
                selected={selectedId === id}
                highlighted={hint?.tileIds.includes(id)}
                onPress={() => void onTilePress(id)}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`வைக்க ${toString(tile)}`}
                style={styles.placeButton}
                onPress={() => place(id)}
              >
                <Text style={styles.placeText}>வைக்க</Text>
              </Pressable>
              </View>
            </DraggableTile>
        ))}
      </View>

      {deadEnd ? (
        <Text accessibilityRole="alert" style={styles.deadEnd}>
          ஒரு படி பின்செல்லுங்கள் · மாற்றத்தை நீக்கவும்
        </Text>
      ) : null}

      <View style={styles.controls}>
        <Pressable accessibilityRole="button" accessibilityLabel="Undo" style={styles.control} onPress={onUndo}>
          <InkIcon name="undo" />
          <Text style={styles.controlText}>பின்செல்</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Restart" style={styles.control} onPress={onRestart}>
          <Text style={styles.restartIcon}>↻</Text>
          <Text style={styles.controlText}>மீண்டும்</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Hint" style={styles.control} onPress={useHint}>
          <InkIcon name="hint" />
          <Text style={styles.controlText}>{kidsMode ? "குறிப்பு" : `குறிப்பு ${game.hintsLeft}`}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function DraggableTile({
  tileId,
  onDrop,
  children,
}: {
  tileId: string;
  onDrop: (tileId: string, event: GestureResponderEvent) => void;
  children: React.ReactNode;
}) {
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_event, gesture) =>
          Math.abs(gesture.dx) + Math.abs(gesture.dy) > 12,
        onPanResponderRelease: (event) => onDrop(tileId, event),
      }),
    [onDrop, tileId],
  );
  return <View {...responder.panHandlers}>{children}</View>;
}

export default function LevelScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const level = levels.find((item) => item.id === Number(params.id)) ?? levels[0];
  return <LevelGame key={level.id} level={level} />;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.templeMaroon },
  content: { alignItems: "center", padding: spacing.md, minHeight: 700 },
  title: { color: colors.sandalCream, fontSize: typography.heading, fontWeight: "800" },
  progressLabel: { color: colors.palmLeaf, fontSize: typography.label, marginTop: spacing.xs },
  progressError: { color: colors.turmeric, fontSize: typography.label, textAlign: "center", marginTop: spacing.xs },
  word: { color: colors.turmeric, fontSize: typography.title, fontWeight: "800", marginTop: spacing.sm },
  slots: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", marginVertical: spacing.md },
  board: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", maxWidth: 390, marginTop: spacing.md },
  tileWrap: { alignItems: "center", marginBottom: spacing.sm },
  placeButton: { minHeight: 48, minWidth: 64, alignItems: "center", justifyContent: "center" },
  placeText: { color: colors.sandalCream, fontSize: typography.label },
  controls: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: spacing.sm, marginTop: spacing.md },
  control: { minHeight: 52, minWidth: 94, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderWidth: 1, borderColor: colors.palmLeaf, borderRadius: 8, paddingHorizontal: spacing.sm },
  controlText: { color: colors.sandalCream, fontSize: typography.label },
  restartIcon: { color: colors.sandalCream, fontSize: 28 },
  deadEnd: { color: colors.turmeric, fontSize: typography.body, fontWeight: "700", textAlign: "center", marginTop: spacing.md },
  success: { alignItems: "center" },
  successText: { color: colors.turmeric, fontSize: typography.title, fontWeight: "800" },
  nextButton: { minHeight: 52, marginTop: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: 8, backgroundColor: colors.turmeric, alignItems: "center", justifyContent: "center" },
  nextText: { color: colors.ink, fontSize: typography.body, fontWeight: "800" },
  pictureClue: { alignItems: "center", marginTop: spacing.sm },
  pictureFrame: { width: 110, height: 82, borderWidth: 1, borderColor: colors.turmeric, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: colors.palmLeaf },
  pictureText: { color: colors.sandalCream, fontSize: typography.label, marginTop: spacing.xs },
});
