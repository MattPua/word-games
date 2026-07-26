# Couch Potato

<p align="center">
  <img src="apps/web/public/logo.png" alt="Couch Potato mascot" width="128" height="128" />
</p>

<p align="center">
  <strong>Swipe adjacent letters. Find words. Stay on the couch.</strong>
</p>

Casual word game for short sessions: swipe paths on a square or honeycomb board, clear a goal, nab a timed haul, or keep a survival timer fed. No hints, no accounts, no cloud — just local profiles and a potato on a sage couch.

**Live:** [acouchpotato.com](https://www.acouchpotato.com)

## Play

- **Goal** — Clear the couch by earning enough points before you run out of target.
- **Timed** — Fixed board, 30–120s; nab as many words as you can before time's up.
- **Survival** — Countdown clock; every accepted word refills time.

Boards are 4×4 / 5×5 / 6×6 on **Square** (8-way) or **Honeycomb** (hex). Spin the board for a new view of the same letters. Score is `length − 2` per word.

Extras on the web build: local **Couch crew** profiles, **Potato Board** personal stats, **Couch medals** achievements, device **Options** (look, titles, SFX, lobby jam), and a ⌘K / Ctrl+K command palette. Lobby setup is shareable via `/play` query params (e.g. `/play?mode=goal&grid=5&board=hex&diff=hard&min=4`).

## Stack

Bun workspaces monorepo:

| Path | Role |
| --- | --- |
| `apps/web` | Vite + React + TanStack Router (ships to Vercel) |
| `apps/mobile` | Expo shell (play still lands on web first) |
| `packages/game-engine` | Pure TS rules, board gen, scoring |
| `packages/dictionary` | Popular / ENABLE lexicons + NSFW + given-name filters |
| `packages/ui` | Board, mascots, shared presentational UI |

Tooling: **Bun**, **Vitest**, **oxfmt** + **oxlint**, **mprocs** for multi-proc local dev.

## Develop

Requires [Bun](https://bun.sh/).

```sh
bun install
bun run --filter @couch-potato/dictionary build   # fetch/filter word lists → JSON artifacts
bun run web                                       # Vite on http://localhost:5173
```

Or one TUI for web + optional tests / typecheck / mobile:

```sh
bun dev    # alias for bun run mprocs
```

Useful scripts from the repo root:

```sh
bun run test        # workspace tests
bun run typecheck
bun run check       # oxlint + oxfmt --check
bun run build       # dictionary + web production build
```

Agent / contributor conventions (voice, engine ownership, UI verify) live in [`AGENTS.md`](./AGENTS.md).

### Optional analytics

Copy `apps/web/.env.example` → `apps/web/.env` and set a real PostHog key if you want product analytics. Without a key (or with the placeholder), PostHog stays off the cold path.

## Offline & light data

Couch Potato is built to stay playable on slow (3G-class) links and after the first visit:

- **Lean cold path** — lobby does not download the play dictionary, lobby jam MP3, medals atlas, or PostHog unless needed.
- **Latin-only fonts** by default (Pixel type / Jersey loads on demand).
- **Service worker (production)** — precaches a small shell (~fonts + CSS + tiny brand marks). Route JS, heavy sprites, and audio use **CacheFirst** after first use so offline lobby/play works once you’ve opened those screens online.
- Profiles, scores, and medals stay in **localStorage** (no account / no sync).

First open still needs a network; after that, revisit offline for screens you’ve already loaded. Lobby jam only fetches when music is turned on.

## Deploy

`vercel.json` builds with `bun run build` and serves `apps/web/dist`. Point a Vercel project at this **repo root** (Root Directory blank — not `apps/web`). If Root Directory is `apps/web`, Output Directory must be `dist` only; `apps/web/dist` then looks in the wrong place and the deploy fails after a green Vite build. Production builds register the service worker automatically.

## Dictionary attribution

Word lists from [dolph/dictionary](https://github.com/dolph/dictionary):

- **`enable1.txt`** — ENABLE Scrabble word list (**public domain**); large, includes obscure terms.
- **`popular.txt`** — common subset: enable1 ∩ [Wiktionary English frequency lists](http://en.wiktionary.org/wiki/Wiktionary:Frequency_lists#English) from TV/movie script samples (~25k everyday words). Membership only — not a frequency CSV.

**Play policy:** accept, board word lists, targets, and Words left use **ENABLE − NSFW blocklist − given-name filter**. Names come from SSA baby-name frequency mass minus a dual-use English allowlist (`name-allowlist.txt`) so `mark`/`hope` stay but `peter`/`john` do not. Popular still ranks board-gen quality and filters Results **Long ones left** (recognizable long misses). Blocklists apply at dictionary build time so blocked tokens never appear in validation, gen, or reveals.

## License

[MIT](./LICENSE) © 2026 Matt Pua

Word lists remain under their upstream terms (ENABLE public domain via dolph/dictionary). Game art and app code in this repository are covered by the MIT license above unless a file says otherwise.
