# Couch Potato

<p align="center">
  <img src="apps/web/public/logo.webp" alt="Couch Potato mascot" width="128" height="128" />
</p>

<p align="center">
  <strong>Swipe adjacent letters. Find words. Stay on the couch.</strong>
</p>

Casual word game for short sessions: swipe paths on a square or honeycomb board, clear a goal, nab a timed haul, or keep a survival timer fed. No hints, no accounts, no cloud — just local profiles and a potato on a sage couch.

**Live:** [www.acouchpotato.com](https://www.acouchpotato.com)

## Play

- **Goal** — Bring points left to zero (Easy / Medium / Hard targets).
- **Timed** — Fixed board; pick **How hard?** (letter mix) and **How long?** (30–120s); find as many words in the time limit.
- **Survival** — Countdown clock; every accepted word refills time (difficulty sets how stingy the start/refills are).

Boards are 4×4 / 5×5 / 6×6 on **Square** (8-way) or **Honeycomb** (hex). Spin the board for a new view of the same letters. Score is `length − 2` per word. Min length floor is 3+ (lobby can raise to 4+ / 5+).

First visit gets a short interactive coach (`/how-to` — **How to play in 30 seconds**); Skip or finish once, reopen anytime from Options (**View Tutorial**).

Extras on the web build: local **Couch crew** profiles, **Potato Board** personal stats, **Couch medals** achievements, device **Options** (Look, Type Clean/Pixel, Words left, SFX, Background music), optional lobby **Ban list**, and a ⌘K / Ctrl+K command palette. Lobby setup is shareable via `/play` query params (e.g. `/play?mode=goal&grid=5&board=hex&diff=hard&min=4`).

## Stack

Bun workspaces monorepo:

| Path | Role |
| --- | --- |
| `apps/web` | Vite + React + TanStack Router (ships to Vercel) |
| `apps/mobile` | Expo shell (play still lands on web first) |
| `packages/game-engine` | Pure TS rules, board gen, scoring |
| `packages/dictionary` | Popular play lexicon + ENABLE artifact + NSFW / given-name filters |
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
bun run test              # workspace tests
bun run typecheck
bun run check             # oxlint + oxfmt --check
bun run build             # dictionary + web production build
bun run sprites:optimize  # lossless WebP crops / downscales for web public/
```

Agent / contributor conventions (voice, engine ownership, UI verify) live in [`AGENTS.md`](./AGENTS.md).

### Optional analytics

Copy `apps/web/.env.example` → `apps/web/.env.local` and set a real `VITE_PUBLIC_POSTHOG_KEY` (+ optional `VITE_PUBLIC_POSTHOG_HOST`) for product analytics + error tracking. Without a key (or with the placeholder), PostHog stays off the cold path.

Game-loop events (how-to, `game_started` / `game_completed`, replay, medals, prefs) live in `apps/web/src/analytics.ts` — catalog in `.cursor/skills/posthog-analytics`. For readable production stack traces, add build-time `POSTHOG_PERSONAL_API_KEY` + `POSTHOG_PROJECT_ID` (source map upload).

## Offline & light data

Couch Potato is built to stay playable on slow (3G-class) links and after the first visit:

- **Lean cold path** — lobby does not download the Play dictionary, Background music MP3, heavy medal marks, or PostHog unless needed.
- **Latin-only fonts** by default (Pixel type / Jersey loads on demand; Type pref flips display + body together).
- **Service worker (production)** — precaches a small shell (~fonts + CSS + tiny brand marks). Route JS, sprites, audio, and the Play dictionary use **CacheFirst** after first use so offline lobby/play works once you’ve opened those screens online.
- Profiles, scores, and medals stay in **localStorage** (no account / no sync).

First open still needs a network; after that, revisit offline for screens you’ve already loaded. Background music only fetches when music is turned on. Play warms the dictionary on hover/focus/click — never idle-prefetch from the lobby.

## Deploy

`vercel.json` builds with `bun run build` and serves `apps/web/dist`. Point a Vercel project at this **repo root** (Root Directory blank — not `apps/web`). If Root Directory is `apps/web`, Output Directory must be `dist` only; `apps/web/dist` then looks in the wrong place and the deploy fails after a green Vite build. Production builds register the service worker automatically.

Canonical site: **https://www.acouchpotato.com** (apex redirects to www).

## Dictionary attribution

Word lists from [dolph/dictionary](https://github.com/dolph/dictionary):

- **`enable1.txt`** — ENABLE Scrabble word list (**public domain**); large, includes obscure terms.
- **`popular.txt`** — common subset: enable1 ∩ [Wiktionary English frequency lists](http://en.wiktionary.org/wiki/Wiktionary:Frequency_lists#English) from TV/movie script samples (~25k everyday words). Membership only — not a frequency CSV.

**Play policy:** accept, board word lists (`allWords`), targets, and Words left use **popular − NSFW blocklist − given-name filter** (~25k everyday words). Full ENABLE is built and kept for a future “dictionary mode” — it must not drive v1 accept (Scrabble scraps like `leu` / `mut` / `thro`). Names come from SSA baby-name frequency mass minus a dual-use English allowlist (`name-allowlist.txt`) so `mark`/`hope` stay but `peter`/`john` do not. Blocklists apply at dictionary build time so blocked tokens never appear in validation, gen, or reveals. The dictionary package loads with the Play route, not the lobby cold chunk.

## License

[MIT](./LICENSE) © 2026 Matt Pua

Word lists remain under their upstream terms (ENABLE public domain via dolph/dictionary). Game art and app code in this repository are covered by the MIT license above unless a file says otherwise.
