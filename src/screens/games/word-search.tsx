import React from "react";
import { PanResponder, Pressable, StyleSheet, Text, View } from "react-native";
import type { LayoutChangeEvent } from "react-native";
import { createWordSearchPuzzle, wordSearchReducer } from "../../engine";
import type { WordSearchState } from "../../engine/word-search";
import { getWords } from "../../words";
import type { WordEntry } from "../../words";
import { getWordMeaning } from "../../content/word-meanings";
import { colors, spacing, typography } from "../../theme";
import { GameFrame, ModeLoading, useModeProgress } from "./common";

export function WordSearchGame({ seed = 0, entries, onComplete }: { seed?: number; entries?: WordEntry[]; onComplete?: () => void }) {
  const mode = "word-search";
  const { stage, streak, advance, ready, error: progressError } = useModeProgress(mode);
  const [words, setWords] = React.useState<WordEntry[] | null>(entries ?? null);
  const [game, setGame] = React.useState<WordSearchState>();
  const [error, setError] = React.useState<string>();
  const [gridWidth, setGridWidth] = React.useState(320);
  const [gridOrigin, setGridOrigin] = React.useState({ x: 0, y: 0 });
  const gridRef = React.useRef<React.ElementRef<typeof View> | null>(null);
  React.useEffect(() => {
    if (entries) return;
    let active = true;
    getWords({ tier: stage > 20 ? "all" : "A", seed })
      .then((loaded) => { if (active) setWords(loaded); })
      .catch((cause: unknown) => { if (active) setError(String(cause)); });
    return () => { active = false; };
  }, [entries, seed, stage]);
  const generated = React.useMemo((): { game?: WordSearchState; error?: string } => {
    if (!words) return {};
    try {
      return {
        game: { puzzle: createWordSearchPuzzle(words, stage, seed + stage), selection: [], found: [], solved: false },
      };
    } catch (cause) {
      return { error: String(cause) };
    }
  }, [seed, stage, words]);
  const activeGame = game ?? generated.game;
  const size = activeGame?.puzzle.size ?? 5;
  const cellSize = Math.min(72, Math.floor(gridWidth / size));

  const cellFromPage = React.useCallback((pageX: number, pageY: number): number | undefined => {
    const x = pageX - gridOrigin.x;
    const y = pageY - gridOrigin.y;
    if (x < 0 || y < 0 || x >= gridWidth || y >= gridWidth) return undefined;
    const row = Math.floor(y / cellSize);
    const column = Math.floor(x / cellSize);
    if (row >= size || column >= size) return undefined;
    return row * size + column;
  }, [cellSize, gridOrigin, gridWidth, size]);
  const dispatch = React.useCallback((action: Parameters<typeof wordSearchReducer>[1]) => {
    setGame((current) => {
      const source = current ?? activeGame;
      if (!source) return current;
      return wordSearchReducer(source, action);
    });
  }, [activeGame]);
  function onLayout(event: LayoutChangeEvent) {
    setGridWidth(event.nativeEvent.layout.width);
    gridRef.current?.measureInWindow((x, y) => setGridOrigin({ x, y }));
  }
  function chooseCell(index: number) {
    const current = activeGame;
    if (!current) return;
    if (current.selection.length === 0) dispatch({ type: "start", cell: index });
    else {
      dispatch({ type: "extend", cell: index });
      dispatch({ type: "release" });
    }
  }
  const panResponder = React.useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dx) + Math.abs(gesture.dy) > 5,
    onPanResponderGrant: (_event, gesture) => {
      const start = cellFromPage(gesture.x0, gesture.y0);
      if (start !== undefined) dispatch({ type: "start", cell: start });
    },
    onPanResponderMove: (_event, gesture) => {
      const cell = cellFromPage(gesture.moveX, gesture.moveY);
      if (cell !== undefined) dispatch({ type: "extend", cell });
    },
    onPanResponderRelease: (_event, gesture) => {
      const cell = cellFromPage(gesture.moveX, gesture.moveY);
      if (cell !== undefined) dispatch({ type: "extend", cell });
      dispatch({ type: "release" });
    },
    onPanResponderTerminate: () => dispatch({ type: "clear" }),
  }), [cellFromPage, dispatch]);

  if (!ready) return <ModeLoading error={progressError} />;
  if (!activeGame) return <ModeLoading error={error ?? generated.error} />;
  const selected = new Set(activeGame.selection);
  const found = new Set(activeGame.found.flat());
  return (
    <GameFrame mode={mode} stage={stage} streak={streak} solved={activeGame.solved} error={progressError} onComplete={onComplete} onNext={() => {
      void advance().then((saved) => { if (saved) setGame(undefined); });
    }}>
      <Text style={styles.instruction}>சொற்களை இழுத்தோ, முதல் கட்டத்தையும் கடைசி கட்டத்தையும் தொட்டோ கண்டுபிடிக்கவும்</Text>
      <View
        ref={gridRef}
        testID="word-search-grid"
        onLayout={onLayout}
        style={[styles.grid, { width: "100%" }]}
        {...panResponder.panHandlers}
      >
        {activeGame.puzzle.grid.flatMap((row, rowIndex) => row.map((tile, columnIndex) => {
          const index = rowIndex * size + columnIndex;
          return (
            <Pressable
              key={index}
              accessibilityRole="button"
              accessibilityLabel={`கட்டம் ${rowIndex + 1}, ${columnIndex + 1}, ${tile}`}
              testID={`word-search-cell-${index}`}
              onPress={() => chooseCell(index)}
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
          const path = activeGame.puzzle.paths[index];
          const foundWord = path !== undefined && activeGame.found.some((foundPath) => foundPath.join(",") === path.join(","));
          return (
            <Text key={word} style={[styles.word, foundWord && styles.foundWord]}>
              {foundWord ? "✓ " : ""}{word}
            </Text>
          );
        })}
      </View>
      {activeGame.puzzle.words.map((word, index) => {
        const path = activeGame.puzzle.paths[index];
        const isFound = path !== undefined && activeGame.found.some((foundPath) => foundPath.join(",") === path.join(","));
        if (!isFound) return null;
        const meaning = getWordMeaning(word);
        return (
          <View key={`meaning-${word}`} style={styles.meaning}>
            <Text style={styles.meaningTitle}>{word}: {meaning.meaning}</Text>
            <Text style={styles.meaningText}>எடுத்துக்காட்டு: {meaning.example}</Text>
          </View>
        );
      })}
    </GameFrame>
  );
}

const styles = StyleSheet.create({
  instruction: { color: colors.sandalCream, fontSize: typography.body, textAlign: "center", marginVertical: spacing.md },
  grid: { flexDirection: "row", flexWrap: "wrap", alignSelf: "center" },
  cell: { borderWidth: 1, borderColor: colors.ink, alignItems: "center", justifyContent: "center", backgroundColor: colors.palmLeaf },
  selected: { backgroundColor: colors.turmeric },
  found: { borderColor: colors.lampAmber, borderWidth: 3, backgroundColor: colors.lampAmber },
  cellText: { color: colors.ink, fontSize: typography.label, fontWeight: "700" },
  progress: { marginTop: spacing.md },
  progressText: { color: colors.turmeric, fontSize: typography.heading, fontWeight: "800" },
  wordList: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", marginTop: spacing.sm },
  word: { color: colors.sandalCream, fontSize: typography.label, margin: spacing.xs },
  foundWord: { textDecorationLine: "line-through", opacity: 0.65 },
  meaning: { backgroundColor: colors.palmLeaf, borderRadius: 8, padding: spacing.md, marginTop: spacing.sm, maxWidth: 380 },
  meaningTitle: { color: colors.ink, fontSize: typography.body, fontWeight: "800" },
  meaningText: { color: colors.ink, fontSize: typography.label, lineHeight: 26, marginTop: spacing.xs },
});
