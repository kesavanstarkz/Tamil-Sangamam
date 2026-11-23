import React from "react";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { colors } from "../src/theme";

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.templeMaroon }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: colors.templeMaroon },
          headerTintColor: colors.sandalCream,
          contentStyle: { backgroundColor: colors.templeMaroon },
        }}
      />
    </GestureHandlerRootView>
  );
}
