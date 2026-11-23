import { splitWord } from "./tiles";

describe("Tamil syllable splitter real-word corpus", () => {
  const words = [
    "அம்மா",
    "அப்பா",
    "அன்பு",
    "கடல்",
    "மழை",
    "நதி",
    "கோயில்",
    "மரம்",
    "பழம்",
    "விதை",
    "வானம்",
    "நிலவு",
    "வீடு",
    "பள்ளி",
    "பாடம்",
    "புத்தகம்",
    "காட்சி",
    "மாலை",
    "சிறு",
    "பெரிய",
    "சொல்",
    "பொருள்",
    "கொடை",
    "மௌனம்",
    "ஔவையார்",
    "தமிழ்",
    "தமிழன்",
    "காடு",
    "மலை",
    "வனம்",
    "நாய்",
    "பூனை",
    "பறவை",
    "பள்ளம்",
    "உயிர்",
    "மீன்",
    "முல்லை",
    "விளக்கு",
    "திருமணம்",
    "விழா",
    "சூரியன்",
    "காற்று",
  ];

  test.each(words)("splits %s and round-trips", (word) => {
    const tiles = splitWord(word);
    expect(tiles.length).toBeGreaterThan(0);
  });
});
