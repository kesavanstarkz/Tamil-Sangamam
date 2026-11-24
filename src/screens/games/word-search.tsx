import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { GestureResponderEvent, LayoutChangeEvent } from "react-native";
import { createWordSearchPuzzle, wordSearchReducer } from "../../engine";
import type { WordSearchState } from "../../engine/word-search";
import { getWords } from "../../words";
import type { WordEntry } from "../../words";
import { colors, spacing, typography } from "../../theme";
import { GameFrame, ModeLoading, useModeProgress } from "./common";

export function WordSearchGame({ seed = 0, entries }: { seed?: number; entries?: WordEntry[] }) {
  const mode = "word-search";
  const { stage, streak, advance, ready, error: progressError } = useModeProgress(mode);
  const [words, setWords] = React.useState<WordEntry[] | null>(entries ?? null);
  const [game, setGame] = React.useState<WordSearchState>();
  const [error, setError] = React.useState<string>();
  const [gridWidth, setGridWidth] = React.useState(280);
  const dragging = React.useRef(false);
  React.useEffect(() => {
    if (entries) return;
    let active = true;
    getWords({ tier: stage > 20 ? "all" : "A", seed })
      .then((loaded) => { if (active) setWords(loaded); })
      .catch((cause: unknown) => { if (active) setError(String(cause)); });
    return () => { active = false; };
  }, [entries, seed, stage]);
  const generated = React.useMemo(() => {
    if (!words) return {} as { game?: WordSearchState; error?: string };
    try {
      return { game: { puzzle: createWordSearchPuzzle(words, stage, seed + stage), selection: [] as number[], found: [] as number[][], solved: false } };
    } catch (cause) {
      return { error: String(cause) };
    }
  }, [seed, stage, words]);
  const activeGame = game ?? generated.game;
  if (!ready) return <ModeLoading error={progressError} />;
  if (!activeGame) return <ModeLoading error={error ?? generated.error} />;
  const gameState = activeGame;
  const size = activeGame.puzzle.size;
  const cellSize = Math.max(56, Math.floor(gridWidth / size));
  const selected = new Set(activeGame.selection);
  const found = new Set(activeGame.found.flat());

  function dispatch(action: Parameters<typeof wordSearchReducer>[1]) {
    setGame((current) => wordSearchReducer(current ?? gameState, action));
  }
  function cellFromEvent(event: GestureResponderEvent): number | undefined {
    const x = event.nativeEvent.locationX;
    const y = event.nativeEvent.locationY;
    if (x < 0 || y < 0 || x >= gridWidth || y >= gridWidth) return undefined;
    const column = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    if (row >= size || column >= size) return undefined;
    return row * size + column;
  }
  function onLayout(event: LayoutChangeEvent) {
    setGridWidth(Math.min(event.nativeEvent.layout.width, size * 56));
  }
  function tapCell(index: number) {
    if (gameState.selection.length === 0) dispatch({ type: "start", cell: index });
    else {
      dispatch({ type: "extend", cell: index });
      setTimeout(() => dispatch({ type: "release" }), 0);
    }
  }
  return (
    <GameFrame mode={mode} stage={stage} streak={streak} solved={activeGame.solved} error={progressError} onNext={() => {
      void advance().then((saved) => { if (saved) setGame(undefined); });
    }}>
      <Text style={styles.instruction}>சொற்களைத் தேட, முதல் கட்டத்திலும் கடைசி கட்டத்திலும் தொடவும்</Text>
      <View
        testID="word-search-grid"
        onLayout={onLayout}
        style={[styles.grid, { width: Math.min(gridWidth, size * 56) }]}
        onTouchStart={(event) => {
          dragging.current = true;
          const cell = cellFromEvent(event);
          if (cell !== undefined) dispatch({ type: "start", cell });
        }}
        onTouchMove={(event) => {
          if (!dragging.current) return;
          const cell = cellFromEvent(event);
          if (cell !== undefined) dispatch({ type: "extend", cell });
        }}
        onTouchEnd={() => {
          if (dragging.current) dispatch({ type: "release" });
          dragging.current = false;
        }}
      >
        {activeGame.puzzle.grid.flatMap((row, rowIndex) => row.map((tile, columnIndex) => {
          const index = rowIndex * size + columnIndex;
          return (
            <Pressable
              key={index}
              accessibilityRole="button"
              accessibilityLabel={`கட்டம் ${rowIndex + 1}, ${columnIndex + 1}, ${tile}`}
              testID={`word-search-cell-${index}`}
              onPress={() => tapCell(index)}
              style={[
                styles.cell,
                { width: cellSize, height: cellSize },
                selected.has(index) && styles.selected,
                found.has(index) && styles.found,
              ]}
            >
              <Text style={styles.cellText}>{tile}</Text>
            </Pressable>
          );
        }))}
      </View>
      <View style={styles.progress}>
        <Text style={styles.progressText}>{activeGame.found.length}/{activeGame.puzzle.words.length}</Text>
      </View>
      <View style={styles.wordList}>
        {activeGame.puzzle.words.map((word, index) => {
          const foundWord = activeGame.found.some((path) => {
            const pathWord = activeGame.puzzle.paths.find((candidate) => candidate.join(",") === path.join(","));
            return pathWord && activeGame.puzzle.words[index] === word;
          });
          return (
            <Text key={word} style={[styles.word, foundWord && styles.foundWord]}>
              {word}
            </Text>
          );
        })}
      </View>
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  instruction: { color: colors.sandalCream, fontSize: typography.body, textAlign: "center", marginVertical: spacing.md },
  grid: { flexDirection: "row", flexWrap: "wrap", maxWidth: "100%", alignSelf: "center" },
  cell: { borderWidth: 1, borderColor: colors.ink, alignItems: "center", justifyContent: "center", backgroundColor: colors.palmLeaf },
  selected: { backgroundColor: colors.turmeric },
  found: { borderColor: colors.lampAmber, borderWidth: 3, backgroundColor: colors.lampAmber },
  cellText: { color: colors.ink, fontSize: typography.label, fontWeight: "700" },
  progress: { marginTop: spacing.md },
  progressText: { color: colors.turmeric, fontSize: typography.heading, fontWeight: "800" },
  wordList: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", marginTop: spacing.sm },
  word: { color: colors.sandalCream, fontSize: typography.label, margin: spacing.xs },
  foundWord: { textDecorationLine: "line-through", opacity: 0.65 },
});
