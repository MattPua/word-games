# Couch Potato

Casual swipe-to-spell word game. Bun monorepo.

## Packages

- `apps/web` — Vite + TanStack Router (Vercel)
- `apps/mobile` — Expo smoke (after playable web)
- `packages/ui` — shared RN + RN-web + NativeWind UI
- `packages/game-engine` — pure TS rules / gen / scoring
- `packages/dictionary` — enable1 + popular + blocklist

## Dictionary attribution

Word lists from [dolph/dictionary](https://github.com/dolph/dictionary). ENABLE is public domain.

## Develop

```sh
bun install
bun run --filter @couch-potato/dictionary build
bun run web
```

See [AGENTS.md](./AGENTS.md).
