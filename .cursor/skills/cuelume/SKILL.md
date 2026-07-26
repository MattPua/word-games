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
- Prefer imperative helpers for word accept/reject and game end (reliable with RN-web): `playAcceptedWordSound`, `playRejectedWordSound`, `playBoardClearedSound`.
- Mute → `setEnabled(false)`; persist `soundEnabled` in app storage. Toggle on **Options** `/options` and **Couch break** (same flag) — not lobby Play bar or play HUD. When muted, all `play(...)` / `playAcceptedWordSound` / `playBoardClearedSound` calls no-op.
- **Background music** (`menuMusicEnabled`, default **off**, + `apps/web/src/menuMusic.ts` / `public/audio/menu-bgm.mp3`) — not cuelume. Don’t wire BGM through `setEnabled`. Loops on lobby / couch crew / medals / options / play when enabled (lower volume on `/play`); fades out on results — not lobby-only. Toggle on **Options** `/options` (Background music Off/On) and **Couch break** mid-run — not lobby Play bar or play HUD. Icons: `Music2` on / local `MusicOff` off (SFX choice cards use `Volume2` / `VolumeX`). Keep `menu-bgm.mp3` lean (~128 kb/s stereo, no embedded cover) for 3G / offline — see `AGENTS.md` Sounds.

## Outcomes

| Event             | Sound                                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Word accepted     | `playAcceptedWordSound(length, { firstWord })` in `apps/web/src/wordAcceptSound.ts` — cohesive ascending-arp ladder: 3 → `success`, 4 → `sparkle`, 5 → `sparkle`+`tick`, 6+ → `sparkle`+`bloom` afterglow (never mid-tier `bloom` alone — pad felt random vs melodic 3/5); first word of run upgrades 3 → `sparkle`                                                                                                                                                                                                 |
| **Board cleared** | `playBoardClearedSound()` in `apps/web/src/boardClearSound.ts` when `found.length === board.allWords.length` (every solvable word) — `sparkle` → `bloom` → `ready`. May coincide with or differ from target remaining→0. Toast: “Board cleared. Every word nabbed!”; ScoreBubble flash. Timed: keep playing; target win: confetti flourish still runs, skip duplicate win bloom/sparkle if clear already fired |
| Invalid submit    | `playRejectedWordSound()` in `apps/web/src/wordRejectSound.ts` — `error` on short / not-in-dict / duplicate; silent on empty path (`bad_path`) or ended game                                                                                                                                                                                                                                                   |
| Game end          | Play curtain call for **every** finish (`apps/web/src/runEndFlourish.ts`): tile drop + confetti + pill, then Results. SFX: won → `bloom`+`sparkle` (skip if board-clear already played); timeout → `sparkle`+`ready`; quit → `bloom`+`tick`. Results confetti also on timeout (and win/high score) |
