import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { LevelGame } from "../../app/level/[id]";
import { levels } from "../levels";

jest.mock("expo-router", () => ({
  router: { back: jest.fn(), push: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: () => ({ id: "1" }),
}));
jest.mock("../audio/soundManager", () => ({
  playMergeSound: jest.fn(),
  playTap: jest.fn(),
  playTileSound: jest.fn(),
}));

describe("LevelGame screen", () => {
  test("placing a tile fills the next expected slot", async () => {
    const { getByLabelText } = await render(<LevelGame level={levels[0]} />);
    await fireEvent.press(getByLabelText("அ"));
    await fireEvent.press(getByLabelText("வைக்க அ"));
    expect(getByLabelText("இடம் 1 நிரம்பியது அ")).toBeTruthy();
  });
});
