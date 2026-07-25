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
- Mute → `setEnabled(false)`; persist a simple flag in app/storage.

## Outcomes

| Event | Sound |
|-------|--------|
| Word accepted | `success` (first word of run: `sparkle` ok) |
| Invalid / duplicate | `error` |
| Game end | `bloom` or `ready` |
| Share / copy ok | `success` |
