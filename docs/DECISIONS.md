# Design decisions

- The app uses the temple maroon palette and keeps the interface dark even in system light mode.
- The game uses tap-select plus placement as a stable, accessible interaction for the first complete build; tile-to-tile drag gestures can be added in a subsequent animation-focused pass.
- English text is retained only for level hints and settings when needed; the primary interface remains Tamil.
- A Tamil word is marked for review rather than corrected when the spelling is uncertain.
- Endless and daily build puzzles use the existing raw-part pool builder and are solver-checked before rendering; new modes keep their rules in pure reducers under `src/engine/`.
- The word-bank API uses `n` as syllable-count filtering and `count` as an optional seeded sample size. Daily selection uses a UTC date seed for a shared puzzle.
- Tier B is available only after stage 20. The checked-in seed intentionally contains no auto-filtered words because Wikimedia dumps were not downloaded; unreviewed content is not mislabeled as Tier A.
- The campaign seed plus four manually checked `docs/WORD_REVIEW.md` entries provides an Antaadhi start with at least four Tier A followers; full breadth still depends on regenerated Tier B content.
- Word-search matches discovered in filler cells are added to the displayed accepted-word list and are valid selections; this keeps the grid solvable without hiding accidental matches.
- Endless progress uses MMKV in standalone/bare native builds and AsyncStorage in Expo Go, development builds, and web. Progress is hydrated before showing a stage, and persistence failures are shown in the game UI.
- Root cause of broken mini-games: the shared GameFrame interaction model mixed generated state with local state and word-search used separate per-cell/pan responders instead of one grid hit-test surface. The fix centralizes state updates in pure reducers and keeps a single grid gesture surface.
