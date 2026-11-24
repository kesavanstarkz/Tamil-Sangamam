# Word bank

The checked-in `assets/words/wordbank.json` is a small offline seed from the
campaign words and `[VERIFIED]` entries in the review document. Full-source
regeneration is a build-time Python 3 operation;
the mobile app never downloads or parses Wikimedia dumps. The builder uses only
dump data and original project code (it does not copy Wikimedia tooling).

## Download and regenerate

Download the current Tamil Wikipedia `pages-articles` XML dump and Tamil
Wiktionary XML dump from the Wikimedia dump portal. Keep the `.xml.bz2` files
outside the repository, then run from the project root:

```powershell
New-Item -ItemType Directory -Force C:\dumps
curl.exe -L https://dumps.wikimedia.org/tawiki/latest/tawiki-latest-pages-articles.xml.bz2 -o C:\dumps\tawiki-latest-pages-articles.xml.bz2
curl.exe -L https://dumps.wikimedia.org/tawiktionary/latest/tawiktionary-latest-pages-articles.xml.bz2 -o C:\dumps\tawiktionary-latest-pages-articles.xml.bz2
python scripts\build_wordbank.py --wiki-dump C:\dumps\tawiki-latest-pages-articles.xml.bz2 --wiktionary-dump C:\dumps\tawiktionary-latest-pages-articles.xml.bz2
```

A local seed-only rebuild is:

```powershell
python scripts\build_wordbank.py --seed-only
```

The builder intersects Wikipedia occurrence counts with Wiktionary page titles,
applies the native-letter, round-trip, length, suffix, and blocklist filters,
then writes compact JSON indexes and a 300-word Tier B sampling CSV. With the
seed-only command there are no Tier B words to sample, so the review CSV contains
only its header. Wikimedia word content is available under CC BY-SA 4.0; the
app's About screen credits its contributors.

The seed contains the campaign words that pass the strict 2–6 syllable
filter (48 of 50; பாரம்பரியம் and சுற்றுச்சூழல் remain in the campaign only)
plus four manually checked words marked `[VERIFIED]` in `docs/WORD_REVIEW.md`.
All 50 campaign levels remain unchanged. It is
below the 10,000–20,000 target until the source dumps are available. The teacher
should review all generated Tier B entries in `docs/WORD_REVIEW_B.csv`; flagged
entries are not treated as teacher-approved.

In the app API, `n` filters by syllable count and `count` optionally selects a
seeded subset. Difficulty and first-syllable indexes are consumed on-device.
