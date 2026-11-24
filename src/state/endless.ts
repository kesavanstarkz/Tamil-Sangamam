import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export interface EndlessProgress {
  stage: number;
  bestStreak: number;
}

interface MMKVStorage {
  getNumber(key: string): number | undefined;
  set(key: string, value: number): void;
}

let mmkvStorage: MMKVStorage | null | undefined;
const STORAGE_ID = "endless-progress";
const usesAsyncStorage = Platform.OS === "web" || __DEV__;

function getMMKVStorage(): MMKVStorage | null {
  if (usesAsyncStorage) {
    mmkvStorage = null;
    return null;
  }
  if (mmkvStorage !== undefined) return mmkvStorage;
  // Expo Go and development bundles must not load a native module absent from Expo Go.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createMMKV } = require("react-native-mmkv") as {
    createMMKV: (options: { id: string }) => MMKVStorage;
  };
  mmkvStorage = createMMKV({ id: STORAGE_ID });
  return mmkvStorage;
}

function parseProgressValue(value: string | null, fallback: number, key: string): number {
  if (value === null) return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error(`Invalid saved progress value for ${key}`);
  }
  return parsed;
}

async function getFromAsyncStorage(mode: string): Promise<EndlessProgress> {
  const keys = [`${mode}.stage`, `${mode}.bestStreak`];
  const values = await AsyncStorage.multiGet(keys);
  const saved = new Map(values);
  return {
    stage: Math.max(1, parseProgressValue(saved.get(keys[0]) ?? null, 1, keys[0])),
    bestStreak: parseProgressValue(saved.get(keys[1]) ?? null, 0, keys[1]),
  };
}

async function writeToAsyncStorage(mode: string, progress: EndlessProgress): Promise<void> {
  await AsyncStorage.multiSet([
    [`${mode}.stage`, String(progress.stage)],
    [`${mode}.bestStreak`, String(progress.bestStreak)],
  ]);
}

export const endlessProgressStore = {
  async get(mode: string): Promise<EndlessProgress> {
    const storage = getMMKVStorage();
    if (storage) {
      return {
        stage: Math.max(1, storage.getNumber(`${mode}.stage`) ?? 1),
        bestStreak: Math.max(0, storage.getNumber(`${mode}.bestStreak`) ?? 0),
      };
    }
    return getFromAsyncStorage(mode);
  },

  async recordWin(mode: string, streak: number): Promise<EndlessProgress> {
    const current = await this.get(mode);
    const next = {
      stage: current.stage + 1,
      bestStreak: Math.max(current.bestStreak, streak),
    };
    const storage = getMMKVStorage();
    if (storage) {
      storage.set(`${mode}.stage`, next.stage);
      storage.set(`${mode}.bestStreak`, next.bestStreak);
    } else {
      await writeToAsyncStorage(mode, next);
    }
    return next;
  },
};
