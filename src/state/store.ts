import AsyncStorage from "@react-native-async-storage/async-storage";

type Progress = Record<string, number>;

const memory = new Map<string, string>();

void AsyncStorage.getAllKeys()
  .then((keys) => AsyncStorage.multiGet(keys))
  .then((entries) => {
    for (const [key, value] of entries) {
      if (value !== null) memory.set(key, value);
    }
  })
  .catch(() => undefined);

function read(key: string): string | undefined {
  return memory.get(key);
}

function write(key: string, value: string): void {
  memory.set(key, value);
  void AsyncStorage.setItem(key, value).catch(() => undefined);
}

export const progressStore = {
  getDaily(date: string): number {
    return Number(read(`daily.${date}.completed`) ?? "0");
  },
  setDaily(date: string, completed: number): void {
    write(`daily.${date}.completed`, String(completed));
  },
  getStars(levelId: number): number {
    return Number(read(`stars.${levelId}`) ?? "0");
  },
  setStars(levelId: number, stars: number): void {
    const current = this.getStars(levelId);
    write(`stars.${levelId}`, String(Math.max(current, stars)));
  },
  getChapterProgress(chapter: number): Progress {
    const raw = read(`chapter.${chapter}`);
    if (!raw) return {};
    try {
      return JSON.parse(raw) as Progress;
    } catch {
      return {};
    }
  },
  getHints(): number {
    return Number(read("hints") ?? "3");
  },
  setHints(count: number): void {
    write("hints", String(Math.max(0, count)));
  },
  getStreak(): number {
    return Number(read("streak") ?? "0");
  },
  setStreak(count: number): void {
    write("streak", String(count));
  },
};

export const settingsStore = {
  getEnglish(): boolean {
    return read("settings.english") === "true";
  },
  setEnglish(enabled: boolean): void {
    write("settings.english", String(enabled));
  },
  getSound(): boolean {
    return read("settings.sound") !== "false";
  },
  setSound(enabled: boolean): void {
    write("settings.sound", String(enabled));
  },
  getHaptics(): boolean {
    return read("settings.haptics") !== "false";
  },
  setHaptics(enabled: boolean): void {
    write("settings.haptics", String(enabled));
  },
  getTamilNumerals(): boolean {
    return read("settings.tamilNumerals") !== "false";
  },
  setTamilNumerals(enabled: boolean): void {
    write("settings.tamilNumerals", String(enabled));
  },
  migrate(): void {
    if (read("schemaVersion") !== "1") {
      write("schemaVersion", "1");
      const endlessBest = read("endless.best");
      if (endlessBest) write("build.endless.best", endlessBest);
    }
  },
};

settingsStore.migrate();
