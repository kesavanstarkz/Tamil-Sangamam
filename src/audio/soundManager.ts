import * as Haptics from "expo-haptics";

export async function playMergeSound(enabled = true): Promise<void> {
  if (!enabled) return;
  // Audio files are intentionally absent in this build. Haptics provide the feedback hook.
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export async function playTap(enabled = true): Promise<void> {
  if (!enabled) return;
  await Haptics.selectionAsync();
}

export async function playTileSound(_tamilText: string): Promise<void> {
  // Sound assets are not bundled yet; this is the offline voice playback hook.
}
