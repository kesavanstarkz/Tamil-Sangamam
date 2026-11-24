import { readFile, mkdir, writeFile } from "node:fs/promises";
import { Resvg } from "@resvg/resvg-js";

await mkdir("assets", { recursive: true });
const svg = await readFile("assets/brand/icon.svg", "utf8");
const base = new Resvg(svg, { fitTo: { mode: "width", value: 1024 } }).render();
await writeFile("assets/icon.png", base.asPng());

const foreground = svg.replace('<rect width="1024" height="1024" fill="#4A1218"/>', "<rect width=\"1024\" height=\"1024\" fill=\"transparent\"/>");
await writeFile("assets/android-icon-foreground.png", new Resvg(foreground, { fitTo: { mode: "width", value: 1024 } }).render().asPng());

const monochrome = svg
  .replaceAll("#4A1218", "#000000")
  .replaceAll("#E2A81D", "#000000")
  .replaceAll("#F2E6C8", "#000000");
await writeFile("assets/android-icon-monochrome.png", new Resvg(monochrome, { fitTo: { mode: "width", value: 1024 } }).render().asPng());
await writeFile("assets/splash-icon.png", new Resvg(svg, { fitTo: { mode: "width", value: 1024 } }).render().asPng());
await writeFile("assets/favicon.png", new Resvg(svg, { fitTo: { mode: "width", value: 512 } }).render().asPng());
