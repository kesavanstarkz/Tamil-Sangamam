import AsyncStorage from "@react-native-async-storage/async-storage";
import { endlessProgressStore } from "./endless";

jest.mock("react-native-mmkv", () => {
  throw new Error("Failed to get NitroModules: unavailable in Expo Go");
});

jest.mock("@react-native-async-storage/async-storage", () => ({
  multiGet: jest.fn(),
  multiSet: jest.fn(),
}));

const multiGet = jest.mocked(AsyncStorage.multiGet);
const multiSet = jest.mocked(AsyncStorage.multiSet);

describe("endless progress storage in development", () => {
  beforeEach(() => {
    multiGet.mockReset();
    multiSet.mockReset();
  });

  test("selects AsyncStorage before loading the MMKV native module", async () => {
    multiGet.mockResolvedValue([
      ["build.stage", "20"],
      ["build.bestStreak", "6"],
    ]);
    multiSet.mockResolvedValue();

    await expect(endlessProgressStore.get("build")).resolves.toEqual({
      stage: 20,
      bestStreak: 6,
    });
    await expect(endlessProgressStore.recordWin("build", 7)).resolves.toEqual({
      stage: 21,
      bestStreak: 7,
    });
    expect(multiSet).toHaveBeenCalledWith([
      ["build.stage", "21"],
      ["build.bestStreak", "7"],
    ]);
  });

  test("rejects malformed saved progress instead of hiding storage corruption", async () => {
    multiGet.mockResolvedValue([
      ["build.stage", "not-a-stage"],
      ["build.bestStreak", null],
    ]);

    await expect(endlessProgressStore.get("build")).rejects.toThrow(
      "Invalid saved progress value for build.stage",
    );
  });
});
