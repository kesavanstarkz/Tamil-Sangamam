import React from "react";
import { PanResponder, Pressable, StyleSheet, Text, View } from "react-native";
import type { LayoutChangeEvent } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { colors, LampGlow, ScreenHeader, spacing, typography } from "../../src/theme";
import { progressStore } from "../../src/state/store";

type Point = { x: number; y: number };
const vowels = ["அ","ஆ","இ","ஈ","உ","ஊ","எ","ஏ","ஐ","ஒ","ஓ","ஔ"];
const meis = ["க்","ச்","ட்","த்","ப்","ற்","ங்","ஞ்","ண்","ந்","ம்","ன்","ய்","ர்","ல்","வ்","ழ்","ள்"];
const vowelSigns = ["", "ா", "ி", "ீ", "ு", "ூ", "ெ", "ே", "ை", "ொ", "ோ", "ௌ"];
const uyirmeis = "கசடதபறஙஞணநமனயரலவழள".split("").flatMap((base) => vowelSigns.map((sign) => `${base}${sign}`));
const letters = [...vowels, ...meis, ...uyirmeis];

function strokePath(points: Point[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y} l 0.1 0`;
  const path = points.reduce((currentPath, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = points[index - 1];
    const middleX = (previous.x + point.x) / 2;
    const middleY = (previous.y + point.y) / 2;
    return `${currentPath} Q ${previous.x} ${previous.y} ${middleX} ${middleY}`;
  }, "");
  const last = points[points.length - 1];
  return `${path} L ${last.x} ${last.y}`;
}

export default function TraceLetter() {
  const { letter = "" } = useLocalSearchParams<{ letter: string }>();
  const [points, setPoints] = React.useState<Point[]>([]);
  const [stars, setStars] = React.useState(0);
  const [size, setSize] = React.useState({ width: 320, height: 340 });
  const [origin, setOrigin] = React.useState({ x: 0, y: 0 });
  const trayRef = React.useRef<React.ElementRef<typeof View> | null>(null);

  React.useEffect(() => {
    let active = true;
    progressStore.hydrate()
      .then(() => { if (active) setStars(progressStore.getTraceStars(letter)); })
      .catch(() => { if (active) setStars(progressStore.getTraceStars(letter)); });
    return () => { active = false; };
  }, [letter]);

  const pointFromPage = React.useCallback((pageX: number, pageY: number): Point => ({
    x: Math.max(0, Math.min(size.width, pageX - origin.x)),
    y: Math.max(0, Math.min(size.height, pageY - origin.y)),
  }), [origin, size.height, size.width]);

  const responder = React.useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event) => setPoints([pointFromPage(event.nativeEvent.pageX, event.nativeEvent.pageY)]),
    onPanResponderMove: (event) => {
      const next = pointFromPage(event.nativeEvent.pageX, event.nativeEvent.pageY);
      setPoints((current) => [...current, next]);
    },
  }), [pointFromPage]);

  function onTrayLayout(event: LayoutChangeEvent) {
    setSize({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height });
    trayRef.current?.measureInWindow((x, y) => setOrigin({ x, y }));
  }

  function retry() {
    setPoints([]);
  }
  function done() {
    if (points.length > 0) {
      progressStore.setTraceStars(letter, 1);
      setStars(progressStore.getTraceStars(letter));
    }
    const index = letters.indexOf(letter);
    const next = letters[index + 1];
    if (next) router.replace({ pathname: "/tracing/[letter]", params: { letter: next } });
    else router.replace("/tracing");
  }

  return (
    <View style={styles.page}>
      <ScreenHeader title="எழுத்துப் பயிற்சி" />
      <Text style={styles.name}>{letter}</Text>
      <View
        ref={trayRef}
        testID="sand-tray"
        onLayout={onTrayLayout}
        style={styles.tray}
        {...responder.panHandlers}
      >
        <Text pointerEvents="none" style={styles.ghost}>{letter}</Text>
        <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width="100%" height="100%">
          <Path testID="trace-stroke" d={strokePath(points)} stroke="#7C542D" strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <Path d={strokePath(points)} stroke="#E8CA91" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      </View>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" style={styles.action} onPress={retry}>
          <Text style={styles.actionText}>மீண்டும்</Text>
        </Pressable>
        <Pressable accessibilityRole="button" style={styles.action} onPress={done}>
          <Text style={styles.actionText}>முடிந்தது</Text>
        </Pressable>
      </View>
      <LampGlow lit={stars > 0} />
      {stars > 0 ? <Text style={styles.stars}>★</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.templeMaroon, alignItems: "center", padding: spacing.md },
  name: { color: colors.turmeric, fontSize: typography.title, marginVertical: spacing.sm },
  tray: { width: "92%", height: 360, maxWidth: 420, borderRadius: 16, backgroundColor: "#C9A66B", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.palmLeaf, overflow: "hidden" },
  ghost: { color: "rgba(242,230,200,0.42)", fontSize: 220, fontWeight: "800", lineHeight: 270 },
  actions: { width: "92%", flexDirection: "row", justifyContent: "space-between", marginTop: spacing.md },
  action: { minWidth: 140, minHeight: 52, borderRadius: 8, backgroundColor: colors.palmLeaf, alignItems: "center", justifyContent: "center" },
  actionText: { color: colors.ink, fontSize: typography.body, fontWeight: "800" },
  stars: { color: colors.turmeric, fontSize: typography.heading, fontWeight: "800" },
});
