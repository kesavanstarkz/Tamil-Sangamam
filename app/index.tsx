import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { LampGlow, KolamBorder, colors, typography, spacing, ScreenHeader } from "../src/theme";

export default function Home() {
  return (
    <View style={styles.container}>
      <ScreenHeader title="தமிழ் சங்கமம்" back={false} />
      <KolamBorder width={360} />
      <LampGlow lit />
      <View style={styles.buttons}>
        <Pressable style={styles.primary} onPress={() => router.push("/chapters")}>
          <Text style={styles.primaryText}>சொல் உருவாக்கம்</Text>
        </Pressable>
        <Pressable style={styles.secondary} onPress={() => router.push("/daily")}>
          <Text style={styles.secondaryText}>இன்றைய சவால்</Text>
        </Pressable>
        <Pressable style={styles.secondary} onPress={() => router.push("/games")}>
          <Text style={styles.secondaryText}>விளையாட்டுகள்</Text>
        </Pressable>
        <Pressable style={styles.secondary} onPress={() => router.push("/tracing")}>
          <Text style={styles.secondaryText}>எழுத்துப் பயிற்சி</Text>
        </Pressable>
        <Pressable style={styles.secondary} onPress={() => router.push("/settings")}>
          <Text style={styles.secondaryText}>அமைப்புகள்</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg, backgroundColor: colors.templeMaroon },
  subtitle: { color: colors.turmeric, fontSize: typography.heading, marginBottom: spacing.xl },
  buttons: { width: "100%", maxWidth: 380, gap: 12 },
  primary: { minHeight: 58, borderRadius: 8, backgroundColor: colors.turmeric, alignItems: "center", justifyContent: "center" },
  primaryText: { color: colors.ink, fontSize: typography.heading, fontWeight: "800" },
  secondary: { minHeight: 52, borderRadius: 8, borderWidth: 1, borderColor: colors.palmLeaf, alignItems: "center", justifyContent: "center" },
  secondaryText: { color: colors.sandalCream, fontSize: typography.body, fontWeight: "700" },
});
