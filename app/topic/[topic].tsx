import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { LevelGame } from "../level/[id]";
import { TOPIC_WORDS, createTopicLevel, type TopicName } from "../../src/content/topics";
import { colors, ScreenHeader, spacing, typography, toTamilNumerals } from "../../src/theme";
import { progressStore } from "../../src/state/store";

const topics = Object.keys(TOPIC_WORDS) as TopicName[];

export default function TopicPractice() {
  const { topic: requestedTopic = "" } = useLocalSearchParams<{ topic: string }>();
  const topic = topics.includes(requestedTopic as TopicName) ? requestedTopic as TopicName : topics[0];
  const [stage, setStage] = React.useState<number | null>(null);
  const topicIndex = topics.indexOf(topic);
  const stars = Array.from({ length: 30 }, (_, index) => progressStore.getStars(20_000 + topicIndex * 100 + index + 1))
    .reduce((total, value) => total + value, 0);
  const level = createTopicLevel(topic, stage ?? 1);

  if (stage !== null) {
    return (
      <LevelGame
        key={level.id}
        level={level}
        headerTitle={`${topic} · ${toTamilNumerals(stage)}`}
        onNext={() => setStage(stage < 30 ? stage + 1 : null)}
      />
    );
  }
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <ScreenHeader title={topic} />
      <Text style={styles.progress}>{toTamilNumerals(stars)}/௯௦</Text>
      <View style={styles.grid}>
        {Array.from({ length: 30 }, (_, index) => {
          const levelNumber = index + 1;
          const levelId = 20_000 + topicIndex * 100 + levelNumber;
          return (
            <Pressable key={levelId} style={styles.node} onPress={() => setStage(levelNumber)}>
              <Text style={styles.nodeNumber}>{toTamilNumerals(levelNumber)}</Text>
              <Text style={styles.nodeStars}>{toTamilNumerals(progressStore.getStars(levelId))}/௩</Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.templeMaroon },
  content: { padding: spacing.md, alignItems: "center" },
  progress: { color: colors.turmeric, fontSize: typography.heading, fontWeight: "800", marginVertical: spacing.md },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
  node: { width: 72, height: 72, margin: 5, borderRadius: 36, borderWidth: 1, borderColor: colors.turmeric, backgroundColor: colors.palmLeaf, alignItems: "center", justifyContent: "center" },
  nodeNumber: { color: colors.ink, fontSize: typography.body, fontWeight: "800" },
  nodeStars: { color: colors.kumkumRed, fontSize: typography.small },
});
