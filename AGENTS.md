# Couch Potato

Swipe adjacent letters on a square grid. Casual word game — short sessions, fast first success, no hints.

## Brand

- Name: **Couch Potato** — silly potato-on-couch SVG (`packages/ui`)
- Whimsical **light-first** (+ soft dark); Sage Garden tokens (tweaked); **Fredoka** + **Nunito**
- Mobile-first; desktop = centered narrow play column
- **Container queries = web-only**; shared layout uses flex + max-width

## Game rules (engine owns these)

- Grids 4×4 / 5×5 / 6×6; **8-way** adjacency; **no tile reuse in one swipe**
- Tiles stay for the round (reusable across words)
- Min word length **3**; no duplicate words per round
- Dictionary: [dolph/dictionary](https://github.com/dolph/dictionary) `enable1.txt` + `popular.txt` + blocklist (ENABLE public domain — attribute in README)
- Scoring: `points = length - 2` (config constant)
- **Target**: `% of board max` × Easy/Med/Hard → end immediately on reach
- **Timed**: fixed board; 30/60/90/120s → results
- **Quit mid-game** → results with progress so far (`won` | `timeout` | `quit`)

## Product surface

- Local profiles only (no cloud/export/sync); high scores per profile × grid × mode × difficulty/duration
- Web share from results (Web Share API + clipboard fallback)
- SEO: title/description/OG/Twitter + JSON-LD (`WebApplication` / `VideoGame`)
- PostHog stub (`VITE_PUBLIC_POSTHOG_KEY`); no-op without key
- Sounds: **[cuelume](https://cuelume-site.pages.dev/agents.md)** on web only — see `.cursor/skills/cuelume`

## Stack

- Bun workspaces; Vitest; Vite + TanStack Router → Vercel
- Shared UI: `packages/ui` (RN + RN-web + NativeWind); Expo later (`apps/mobile`)
- Pointer Events for swipe paths (web); Hammer.js = reference only
- CSS/NativeWind motion first; no anime.js unless a real gap

## Code style

TPP DRY: one authoritative place per piece of knowledge. No over-abstraction, no one-export files. Engine decides; UI displays.

## Agent UI verification (required)

UI work is **not done** until interactively verified in a running local app (pointer swipe across tiles — not click-only). See `.cursor/skills/verify-ui`. Engine-only → Vitest; UI → Vitest **and** interactive check.

## Living agent docs

When the user locks a new decision, update `AGENTS.md` / `.cursor/rules/` / `.cursor/skills/` in the same turn. See `.cursor/skills/sync-agent-docs` and `.cursor/rules/agent-docs.mdc`.

## Out of scope (v1)

Hints, cloud, combos/multipliers, Next.js, Web Worker for gen, daily/streaks, fancy share images, real PostHog key.

## Pointers

- Rules: `.cursor/rules/` (`coding`, `agent-docs`, `ui`, `engine`)
- Skills: `.cursor/skills/` (`verify-ui`, `cuelume`, `sync-agent-docs`, `new-mode-or-scoring`)
