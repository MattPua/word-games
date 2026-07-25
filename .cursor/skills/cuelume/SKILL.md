---
name: cuelume
description: Install and wire cuelume interaction sounds on the Couch Potato web app. Use when adding, fixing, or muting web sounds.
---

# cuelume

Follow the official guide: https://cuelume-site.pages.dev/agents.md

## Install

```sh
bun add cuelume
```

in `apps/web` only. **Not used on Expo** (Web Audio).

## Wire

- `bind()` once at app root (`useEffect`) for optional declarative chrome (`data-cuelume-*`).
- Prefer imperative `play("success" | "error" | …)` for word accept/reject and game end (reliable with RN-web).
- Mute → `setEnabled(false)`; persist `soundEnabled` in app storage. Toggle on **home, play HUD, and pause menu** (same flag). When muted, all `play(...)` / `playAcceptedWordSound` / `playBoardClearedSound` calls no-op.
- **Lobby jam** is separate (`menuMusicEnabled` + `apps/web/src/menuMusic.ts` / `public/audio/menu-bgm.mp3`) — not cuelume. Don’t wire BGM through `setEnabled`.

## Outcomes

| Event               | Sound                                                                                                                                                                                                          |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Word accepted       | `playAcceptedWordSound(length, { firstWord })` in `apps/web/src/wordAcceptSound.ts` — length escalates: 3 → `success`, 4–5 → `bloom`, 6+ → `sparkle`+`tick`; first word of run upgrades short/mid to `sparkle` |
| **Board cleared**   | `playBoardClearedSound()` in `apps/web/src/boardClearSound.ts` when `found.length === board.allWords.length` (every solvable word) — `sparkle` → `bloom` → `ready`. May coincide with or differ from target remaining→0. Toast: “Board cleared — every word nabbed!”; ScoreBubble flash. Timed: keep playing; target win: confetti flourish still runs, skip duplicate win bloom/sparkle if clear already fired |
| Invalid / duplicate | `error`                                                                                                                                                                                                        |
| Game end            | `bloom`+`sparkle` (won, unless board-clear already played) or `ready` (timeout/quit)                                                                                                                             |
| Share / copy ok     | `success`                                                                                                                                                                                                      |
