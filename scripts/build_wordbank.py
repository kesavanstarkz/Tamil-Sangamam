#!/usr/bin/env python3
"""Build the app word bank from local Tamil Wikipedia and Wiktionary XML dumps."""

import argparse
import bz2
import csv
import json
import random
import re
import sys
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MEIS = set("கஙசஞடணதநபமயரலவழளறன")
VOWEL_LIST = "அஆஇஈஉஊஎஏஐஒஓஔ"
VOWELS = set(VOWEL_LIST)
SIGNS = {"ா": "ஆ", "ி": "இ", "ீ": "ஈ", "ு": "உ", "ூ": "ஊ",
         "ெ": "எ", "ே": "ஏ", "ை": "ஐ", "ொ": "ஒ", "ோ": "ஓ", "ௌ": "ஔ"}
PULLI = "்"
ALLOWED = MEIS | VOWELS | set(SIGNS) | {PULLI}
GRANTHA = set("ஜஷஸஹ")
WORD_RE = re.compile(r"[\u0B80-\u0BFF]+")
SUFFIXES = ("உடன்", "களை", "உக்கு", "ஆல்", "இல்", "க்கு", "இன்", "கள்", "ஐ")


def split_word(word):
    chars = list(word)
    parts = []
    index = 0
    while index < len(chars):
        char = chars[index]
        if char in VOWELS:
            parts.append(("u", char))
            index += 1
        elif char in MEIS:
            if index + 1 < len(chars) and chars[index + 1] == PULLI:
                parts.append(("m", char))
                index += 2
            elif index + 1 < len(chars) and chars[index + 1] in SIGNS:
                parts.append(("v", char, SIGNS[chars[index + 1]]))
                index += 2
            else:
                parts.append(("v", char, "அ"))
                index += 1
        else:
            raise ValueError(f"unsupported character {char!r}")

    rebuilt = []
    for token in parts:
        if token[0] == "u":
            rebuilt.append(token[1])
        elif token[0] == "m":
            rebuilt.extend((token[1], PULLI))
        else:
            vowel = token[2]
            sign = next((key for key, value in SIGNS.items() if value == vowel), "")
            rebuilt.append(token[1] + sign)
    if "".join(rebuilt) != word:
        raise ValueError("word does not round-trip")
    return parts


def key(token):
    if token[0] == "u":
        return "u:" + str(VOWEL_LIST.index(token[1]))
    if token[0] == "m":
        return "m:" + token[1]
    return "v:" + token[1] + ":" + str(VOWEL_LIST.index(token[2]))


def token_text(token):
    if token[0] == "u":
        return token[1]
    if token[0] == "m":
        return token[1] + PULLI
    sign = next((key for key, value in SIGNS.items() if value == token[2]), "")
    return token[1] + sign


def valid_word(word):
    return (
        word
        and not any(char in GRANTHA for char in word)
        and all(char in ALLOWED for char in word)
    )


def dump_pages(filename):
    opener = bz2.open if str(filename).endswith(".bz2") else open
    with opener(filename, "rb") as stream:
        context = ET.iterparse(stream, events=("start", "end"))
        _, root = next(context)
        for event, element in context:
            if event != "end":
                continue
            if element.tag.endswith("}page"):
                namespace = element.find("./{*}ns")
                title = element.find("./{*}title")
                text = element.find(".//{*}text")
                if namespace is not None and namespace.text == "0" and title is not None:
                    yield title.text or "", (text.text or "") if text is not None else ""
                root.clear()


def read_blocklist():
    filename = ROOT / "scripts" / "blocklist.txt"
    return {
        line.strip()
        for line in filename.read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.lstrip().startswith("#")
    }


def campaign_words():
    words = []
    for filename in sorted((ROOT / "src" / "levels").glob("chapter*.json")):
        for level in json.loads(filename.read_text(encoding="utf-8")):
            words.append(level["word"])
    return words


def verified_words():
    review_file = ROOT / "docs" / "WORD_REVIEW.md"
    verified = []
    for line in review_file.read_text(encoding="utf-8").splitlines():
        match = re.match(r"^\s*-\s+([\u0B80-\u0BFF]+)\s+\[VERIFIED\]\s*$", line)
        if match:
            verified.append(match.group(1))
    return verified


def difficulty(word, syllables, rank, population):
    score = 1
    if len(syllables) >= 4:
        score += 1
    if any(char in word for char in "ழளறனண"):
        score += 1
    if any(char in word for char in "ஐஔஒஓ"):
        score += 1
    if syllables[-1][0] == "m":
        score += 1
    if rank > max(1, population * 0.75):
        score += 1
    return min(5, score)


def build(args):
    blocked = read_blocklist()
    campaign = campaign_words()
    hand_verified = set(campaign) | set(verified_words())
    frequencies = Counter()
    titles = set()

    if args.wiki_dump and args.wiktionary_dump:
        for _, text in dump_pages(args.wiki_dump):
            frequencies.update(WORD_RE.findall(text))
        for title, _ in dump_pages(args.wiktionary_dump):
            titles.add(title)
        eligible = {
            word: count for word, count in frequencies.items()
            if count >= args.minimum_count and word in titles
        }
    elif args.seed_only:
        eligible = {}
    else:
        raise SystemExit("Pass both dump files or use --seed-only.")

    for word in hand_verified:
        eligible.setdefault(word, max(args.minimum_count, 1))

    accepted = {}
    for word, count in eligible.items():
        if word in blocked or not valid_word(word):
            continue
        try:
            tokens = split_word(word)
        except ValueError:
            continue
        if not 2 <= len(tokens) <= 6:
            continue
        accepted[word] = (count, tokens)

    # Remove case/plural forms only when the corresponding base is present.
    for word in list(accepted):
        for suffix in SUFFIXES:
            stem = word[:-len(suffix)] if word.endswith(suffix) else ""
            if stem.endswith("ு"):
                stem = stem[:-1] + PULLI
            if stem and stem in accepted:
                accepted.pop(word, None)
                break

    ranked = sorted(accepted.items(), key=lambda item: (-item[1][0], item[0]))
    token_catalog = {}
    for _, (_, tokens) in ranked:
        for token in tokens:
            token_catalog.setdefault(key(token), token)
    syllable_keys = sorted(token_catalog)
    syllable_ids = {value: index for index, value in enumerate(syllable_keys)}
    syllables = [token_text(token_catalog[syllable_key]) for syllable_key in syllable_keys]
    words = []
    for rank, (word, (count, tokens)) in enumerate(ranked, start=1):
        tier = "A" if word in hand_verified else "B"
        words.append({
            "w": word,
            "n": len(tokens),
            "f": rank,
            "d": difficulty(word, tokens, rank, len(ranked)),
            "t": tier,
            "k": key(tokens[0]),
            "e": None if tokens[-1][0] == "m" else key(tokens[-1]),
            "s": [syllable_ids[key(token)] for token in tokens],
        })

    tier_a = [word for word in words if word["t"] == "A"]
    tier_b = [word for word in words if word["t"] == "B"]
    tier_b = tier_b[:max(0, 20_000 - len(tier_a))]

    def serialize_bank(entries):
        by_difficulty = {str(level): [] for level in range(1, 6)}
        by_first = {}
        for index, word in enumerate(entries):
            by_difficulty[str(word["d"])].append(index)
            by_first.setdefault(word["k"], []).append(index)
        output = {
            "words": entries,
            "byDifficulty": by_difficulty,
            "byFirstSyllable": by_first,
            "syllables": syllables,
        }
        return json.dumps(output, ensure_ascii=False, separators=(",", ":")) + "\n"

    selected = sorted(tier_a + tier_b, key=lambda word: word["f"])
    serialized = serialize_bank(selected)
    while len(serialized.encode("utf-8")) > 1_500_000 and len(selected) > 10_000:
        tier_b = tier_b[:-min(500, len(selected) - 10_000)]
        selected = sorted(tier_a + tier_b, key=lambda word: word["f"])
        serialized = serialize_bank(selected)
    if len(serialized.encode("utf-8")) > 1_500_000:
        raise ValueError("The word bank exceeds 1.5 MB before reaching 10,000 words.")
    output_path = ROOT / "assets" / "words" / "wordbank.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(serialized, encoding="utf-8")
    with (ROOT / "docs" / "WORD_REVIEW_B.csv").open("w", newline="", encoding="utf-8-sig") as file:
        writer = csv.writer(file)
        writer.writerow(["word", "difficulty", "frequency_rank", "review"])
        review_sample = random.Random(42).sample(tier_b, min(300, len(tier_b)))
        writer.writerows([word["w"], word["d"], word["f"], "NEEDS REVIEW"] for word in review_sample)
    print(f"Wrote {len(selected)} words ({len(tier_a)} Tier A, "
          f"{len(tier_b)} Tier B) to {output_path}")
    print(f"JSON size: {output_path.stat().st_size:,} bytes")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--wiki-dump", help="Path to the Tamil Wikipedia pages-articles XML dump")
    parser.add_argument("--wiktionary-dump", help="Path to the Tamil Wiktionary XML dump")
    parser.add_argument("--minimum-count", type=int, default=5)
    parser.add_argument("--seed-only", action="store_true", help="Build from the campaign seed only")
    build(parser.parse_args())


if __name__ == "__main__":
    try:
        main()
    except (OSError, ET.ParseError) as error:
        print(f"Word bank build failed: {error}", file=sys.stderr)
        raise
