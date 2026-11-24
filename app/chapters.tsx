import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { colors, ScreenHeader, spacing, typography, toTamilNumerals } from "../src/theme";
import { progressStore } from "../src/state/store";
import { TOPIC_WORDS, type TopicName } from "../src/content/topics";

const chapters = [
  "தொடக்கம்",
  "பயணம்",
  "நதி",
  "கோயில்",
  "திருவிழா",
] as const;
const topicNames = Object.keys(TOPIC_WORDS) as TopicName[];

type PathItem =
  | { kind: "lesson"; chapter: number; key: string }
  | { kind: "topic"; topic: TopicName; key: string }
  | { kind: "endless"; key: string }
  | { kind: "generated"; stage: number; key: string };

const initialItems: PathItem[] = [
  ...chapters.flatMap((_, index) => [
    { kind: "lesson" as const, chapter: index + 1, key: `lesson-${index + 1}` },
    ...topicNames.slice(index * 2, index * 2 + 2).map((topic) => ({ kind: "topic" as const, topic, key: `topic-${topic}` })),
  ]),
  { kind: "endless", key: "endless" },
  ...Array.from({ length: 8 }, (_, index) => ({ kind: "generated" as const, stage: index + 1, key: `path-${index + 1}` })),
];

export default function Chapters() {
  const [items, setItems] = React.useState(initialItems);
  const [, setProgressVersion] = React.useState(0);
  const [progressError, setProgressError] = React.useState<string>();
  const nextStage = React.useRef(9);
  const loadingMore = React.useRef(false);

  useFocusEffect(React.useCallback(() => {
    let active = true;
    progressStore.hydrate()
      .then(() => { if (active) setProgressVersion((version) => version + 1); })
      .catch((cause: unknown) => { if (active) setProgressError(String(cause)); });
    return () => { active = false; };
  }, []));

  function loadMore() {
    if (loadingMore.current) return;
    loadingMore.current = true;
    const batch = Array.from({ length: 8 }, () => {
      const stage = nextStage.current++;
      return { kind: "generated" as const, stage, key: `path-${stage}` };
    });
    setItems((current) => [...current, ...batch]);
    loadingMore.current = false;
  }

  function renderItem({ item }: { item: PathItem }) {
    if (item.kind === "lesson") {
      const stars = Array.from({ length: 10 }, (_, index) => (item.chapter - 1) * 10 + index + 1)
        .reduce((total, id) => total + progressStore.getStars(id), 0);
      return (
        <Pressable style={styles.lesson} onPress={() => router.push(`/chapter/${item.chapter}`)}>
          <View style={styles.badge}><Text style={styles.badgeText}>{toTamilNumerals(item.chapter)}</Text></View>
          <View style={styles.details}>
            <Text style={styles.title}>பாடம் · {chapters[item.chapter - 1]}</Text>
            <Text style={styles.subtitle}>அத்தியாயம் {toTamilNumerals(item.chapter)}</Text>
          </View>
          <Text style={styles.progress}>{toTamilNumerals(stars)}/௩௦</Text>
        </Pressable>
      );
    }
    if (item.kind === "topic") {
      const topicIndex = topicNames.indexOf(item.topic);
      const stars = Array.from({ length: 30 }, (_, index) => progressStore.getStars(20_000 + topicIndex * 100 + index + 1))
        .reduce((total, value) => total + value, 0);
      return (
        <Pressable
          accessibilityRole="button"
          style={styles.topic}
          onPress={() => router.push({ pathname: "/topic/[topic]", params: { topic: item.topic } })}
        >
          <View style={styles.badge}><Text style={styles.badgeText}>◌</Text></View>
          <View style={styles.details}>
            <Text style={styles.title}>{item.topic}</Text>
            <Text style={styles.subtitle}>தலைப்புப் பயிற்சி</Text>
          </View>
          <Text style={styles.progress}>{toTamilNumerals(stars)}/௯௦</Text>
        </Pressable>
      );
    }
    if (item.kind === "endless") {
      return (
        <Pressable style={styles.endless} onPress={() => router.push("/endless")}>
          <Text style={styles.endlessTitle}>முடிவிலி ∞</Text>
          <Text style={styles.endlessSub}>தொடர்ந்து சொற்களை உருவாக்குங்கள்</Text>
        </Pressable>
      );
    }
    return (
      <Pressable style={styles.path} onPress={() => router.push(`/path/${item.stage}`)}>
        <View style={styles.pathDot}><Text style={styles.pathNumber}>{toTamilNumerals(item.stage)}</Text></View>
        <Text style={styles.pathText}>பயண நிலை</Text>
      </Pressable>
    );
  }

  return (
    <FlatList
      style={styles.page}
      contentContainerStyle={styles.content}
      data={items}
      keyExtractor={(item) => item.key}
      ListHeaderComponent={<View><ScreenHeader title="சொல் உருவாக்கம்" />{progressError ? <Text accessibilityRole="alert" style={styles.error}>{progressError}</Text> : null}</View>}
      renderItem={renderItem}
      onEndReached={loadMore}
      onEndReachedThreshold={0.6}
    />
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.templeMaroon },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  lesson: { minHeight: 88, marginVertical: spacing.xs, borderRadius: 10, backgroundColor: colors.palmLeaf, borderWidth: 1, borderColor: colors.turmeric, padding: spacing.md, flexDirection: "row", alignItems: "center" },
  topic: { minHeight: 76, marginVertical: spacing.xs, borderRadius: 10, backgroundColor: "#541820", borderWidth: 1, borderColor: colors.palmLeaf, padding: spacing.md, flexDirection: "row", alignItems: "center" },
  details: { flex: 1, marginLeft: spacing.md },
  badge: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.turmeric, alignItems: "center", justifyContent: "center" },
  badgeText: { color: colors.ink, fontSize: typography.heading, fontWeight: "800" },
  title: { color: colors.ink, fontSize: typography.body, fontWeight: "800" },
  subtitle: { color: colors.ink, fontSize: typography.label, marginTop: 4 },
  progress: { color: colors.kumkumRed, fontSize: typography.body, fontWeight: "800" },
  endless: { minHeight: 80, borderRadius: 10, borderWidth: 2, borderColor: colors.turmeric, backgroundColor: colors.templeMaroon, marginVertical: spacing.md, alignItems: "center", justifyContent: "center" },
  endlessTitle: { color: colors.turmeric, fontSize: typography.heading, fontWeight: "800" },
  endlessSub: { color: colors.sandalCream, fontSize: typography.label },
  path: { minHeight: 68, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  pathDot: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.palmLeaf, alignItems: "center", justifyContent: "center" },
  pathNumber: { color: colors.ink, fontSize: typography.body, fontWeight: "800" },
  pathText: { color: colors.sandalCream, fontSize: typography.label, marginLeft: spacing.md },
  error: { color: colors.turmeric, fontSize: typography.label, textAlign: "center" },
});
