# Couch Potato

Casual swipe-to-spell word game. Bun monorepo.

## Packages

- `apps/web` — Vite + TanStack Router (Vercel)
- `apps/mobile` — Expo smoke (after playable web)
- `packages/ui` — shared RN + RN-web + NativeWind UI
- `packages/game-engine` — pure TS rules / gen / scoring
- `packages/dictionary` — enable1 + popular + blocklist

## Dictionary attribution

Word lists from [dolph/dictionary](https://github.com/dolph/dictionary).

- **`enable1.txt`** — ENABLE Scrabble word list (public domain); large, includes obscure terms.
- **`popular.txt`** — common subset: enable1 ∩ [Wiktionary English frequency lists](http://en.wiktionary.org/wiki/Wiktionary:Frequency_lists#English) derived from TV/movie script samples (~25k words people know). Membership only — dolph does not ship a frequency CSV.
- **v1 policy:** accept / board scoring words / missed reveals use **popular only**. Obscure enable1-only words are rejected and never surface in targets or results. A fuller enable1 “dictionary mode” may come later.
- Local **offensive/NSFW blocklist** applied at build time to both lists.

## Develop

```sh
bun install
bun run --filter @couch-potato/dictionary build
bun run web
```

See [AGENTS.md](./AGENTS.md).
