jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("react-native-svg", () => {
  const React = require("react");
  const Svg = ({ children, ...props }) => React.createElement("Svg", props, children);
  const Shape = ({ children, ...props }) => React.createElement("SvgShape", props, children);
  return {
    __esModule: true,
    default: Svg,
    Svg,
    Path: Shape,
    Circle: Shape,
    Ellipse: Shape,
    Rect: Shape,
  };
});
