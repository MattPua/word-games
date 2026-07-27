---
name: sfx
description: Wire Couch Potato web SFX (live Web Audio recipes + path-select scale). Use when adding, fixing, or muting web sounds.
---

# sfx

Own Web Audio SFX in `apps/web/src/sfx/` — recipe layers + soft envelopes (+ shimmer), same idea as [cuelume](https://cuelume-site.pages.dev/agents.md) but in-repo (no package). **Not used on Expo** yet.

## Wire

- Imperative: `play(name)` / `playScaleNote(hz)` / `playTone(hz)` from `apps/web/src/sfx`.
- Mute → `setEnabled(false)`; persist `soundEnabled` in app storage. Toggle on **Options** `/options` and **Couch break** (same flag) — not lobby Play bar or play HUD. When muted, all `play` / `playScaleNote` / `playTone` / outcome helpers no-op.
- Outcome helpers stay thin: `playAcceptedWordSound`, `playRejectedWordSound`, `playBoardClearedSound`, `playRunEndSound`, `pathSelectOnChange`, `playPauseSound` / `playResumeSound`.
- **Path select** (`pathSelectSound.ts`): C major from **C5** (do re mi fa so la ti…); tip note on grow **and** backtrack; silent on full clear. Voice = `playScaleNote` (triangle + soft octave), not a clicky tick.
- **Background music** (`menuMusicEnabled`, default **off**, + `apps/web/src/menuMusic.ts` / `public/audio/menu-bgm.mp3`) — not the SFX engine. Don’t wire BGM through `setEnabled`. Loops on lobby / couch crew / medals / options / play when enabled (lower volume on `/play`); fades out on results. Toggle on **Options** + **Couch break**. Keep `menu-bgm.mp3` lean (~128 kb/s stereo, no embedded cover) for 3G / offline — see `AGENTS.md` Sounds.

## Palette (`sfx/recipes.ts`)

| Name | Use |
| ---- | --- |
| `success` | 3-letter accept (warm 3-note arp) |
| `sparkle` | 4+ accept ladder / flourishes |
| `tick` | 5-letter accept accent / quit end beat |
| `bloom` | 6+ afterglow / win / quit |
| `error` | Invalid submit |
| `ready` | Board spin / board-clear / timeout end |
| `pause` | Couch break open (soft descending settle) |
| `resume` | Couch break close via Resume / Escape (soft ascending wake) |

## Outcomes

| Event | Sound |
| ----- | ----- |
| Path select | `pathSelectOnChange` / `playPathSelectTone` — C major do–re–mi… from C5 via `playScaleNote`; grow **and** backtrack (tip note); silent on full clear. Play + how-to player swipes (not ghost demo). |
| Word accepted | `playAcceptedWordSound` — 3 `success` (first → `sparkle`) → 4 `sparkle`+`tick` → 5 `sparkle`+`tick` → 6+ `sparkle`+`bloom`+`tick` (+ UI micro confetti on Play) |
| Board cleared | `playBoardClearedSound` — `sparkle` → `bloom` → `ready` |
| Invalid submit | `playRejectedWordSound` — `error` (not empty cancel) |
| Game end | `playRunEndSound` — won `bloom`+`sparkle` (skip if board-clear already); timeout `sparkle`+`ready`; quit `bloom`+`tick` |
| Couch break | `playPauseSound` / `playResumeSound` — open `pause`; Resume / Escape `resume`; End run / Restart stay silent |

## Adding a sound

1. Add a recipe in `sfx/recipes.ts` (tone and/or noise layers; optional shimmer).
2. Call `play("name")` from an outcome helper — don’t scatter magic numbers in pages.
