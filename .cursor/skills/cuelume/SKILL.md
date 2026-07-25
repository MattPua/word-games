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
- Mute → `setEnabled(false)`; persist `soundEnabled` in app storage. Toggle on **home and play HUD** (same flag). When muted, all `play(...)` / `playAcceptedWordSound` calls no-op.

## Outcomes

| Event               | Sound                                                                                                                                                                                                          |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Word accepted       | `playAcceptedWordSound(length, { firstWord })` in `apps/web/src/wordAcceptSound.ts` — length escalates: 3 → `success`, 4–5 → `bloom`, 6+ → `sparkle`+`tick`; first word of run upgrades short/mid to `sparkle` |
| Invalid / duplicate | `error`                                                                                                                                                                                                        |
| Game end            | `bloom` or `ready`                                                                                                                                                                                             |
| Share / copy ok     | `success`                                                                                                                                                                                                      |
