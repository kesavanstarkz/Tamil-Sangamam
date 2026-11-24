import React, { useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { colors, typography, spacing, ScreenHeader } from "../src/theme";
import { progressStore, settingsStore } from "../src/state/store";

export default function Settings() {
  const [english, setEnglish] = useState(settingsStore.getEnglish());
  const [sound, setSound] = useState(settingsStore.getSound());
  const [haptics, setHaptics] = useState(settingsStore.getHaptics());
  const [tamilNumerals, setTamilNumerals] = useState(settingsStore.getTamilNumerals());

  function toggleEnglish(value: boolean): void {
    setEnglish(value);
    settingsStore.setEnglish(value);
  }

  function toggleSound(value: boolean): void {
    setSound(value);
    settingsStore.setSound(value);
  }

  function toggleHaptics(value: boolean): void {
    setHaptics(value);
    settingsStore.setHaptics(value);
  }

  return (
    <View style={styles.page}>
      <ScreenHeader title="அமைப்புகள்" />
      <Setting label={english ? "English interface" : "ஆங்கிலம்"} value={english} onChange={toggleEnglish} />
      <Setting label="ஒலி" value={sound} onChange={toggleSound} />
      <Setting label="அதிர்வு" value={haptics} onChange={toggleHaptics} />
      <Setting label="தமிழ் எண்ணெழுத்து" value={tamilNumerals} onChange={(value) => { setTamilNumerals(value); settingsStore.setTamilNumerals(value); }} />
      <Pressable accessibilityRole="button" style={styles.about} onPress={() => progressStore.setHints(3)}>
        <Text style={styles.aboutText}>குறிப்புகள் மீட்டமை</Text>
      </Pressable>
      <Pressable style={styles.about}>
        <Text style={styles.aboutText}>நன்றி: Tamil Wikipedia, Wiktionary; CC BY-SA 4.0; open-tamil (MIT)</Text>
      </Pressable>
    </View>
  );
}

function Setting({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <View style={styles.setting}>
      <Text style={styles.label}>{label}</Text>
      <Switch value={value} onValueChange={onChange} thumbColor={value ? colors.turmeric : colors.palmLeaf} trackColor={{ false: colors.ink, true: colors.kumkumRed }} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.templeMaroon, padding: spacing.lg },
  setting: { minHeight: 64, borderBottomWidth: 1, borderBottomColor: colors.palmLeaf, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label: { color: colors.sandalCream, fontSize: typography.heading },
  about: { marginTop: spacing.xl, minHeight: 52, alignItems: "center", justifyContent: "center" },
  aboutText: { color: colors.palmLeaf, fontSize: typography.label },
});
