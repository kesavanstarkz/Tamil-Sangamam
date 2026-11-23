module.exports = {
  preset: "@react-native/jest-preset",
  testEnvironment: "node",
  testMatch: ["**/*.test.{ts,tsx}"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
};
