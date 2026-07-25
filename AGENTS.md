# Couch Potato

Swipe adjacent letters on a square or honeycomb grid. Casual word game — short sessions, fast first success, no hints.

## Brand

- Name: **Couch Potato** — silly potato-on-couch SVG (`packages/ui`)
- Whimsical **light-first** (+ soft dark); Sage Garden tokens (tweaked); **Grandstander** (display) + **Lexend** (body/tiles)
- **Color roles:** `primary` = sage (actions, path); `secondary` = potato gold (badges, selected lobby cards, secondary buttons); `accent` = soft sage wash; `muted` = soft sage-gray surfaces. Prefer `bg-secondary` / `text-secondary` over ad-hoc potato hex. See `.cursor/rules/ui.mdc`.
- Mobile-first; desktop = centered narrow play column
- **Container queries = web-only**; shared layout uses flex + max-width
- **Motion:** meaningful interactivity should show the change (short CSS/NativeWind transitions — segments, presses, score ticks, screen enters). Whimsical + performant; few intentional motions, not noise; respect `prefers-reduced-motion`. No anime.js unless CSS can’t cover it.
- **UI inspiration:** [TypeUI](https://www.typeui.sh/) principles (tokens first → hierarchy / type rhythm / interaction feedback) + tactile word-game craft (pillow cream tiles, thick sage board frame, path + select rings, word pill + potato score badge). Keep cream/sage/potato — never purple demo clones. See `.cursor/rules/ui.mdc`.
- **Copy / voice:** prefer **gaming terminology** (Play, lobby, run, haul, SFX, spin) over sterile app/form words (Submit, Settings, Confirm). Whimsical Couch Potato — clear for casual players, not esports jargon. Icon tooltips match. Details: `.cursor/rules/ui.mdc`.

## Game rules (engine owns these)

- Grids 4×4 / 5×5 / 6×6; topology **square** (8-way) or **hex / B-comb** (6-way odd-r); **no tile reuse in one swipe**
- **Rotate:** same letters, new view — **90°** CW or CCW (separate controls). Physical CSS board spin (~420ms) then remap; clears path + blocks input mid-spin. Glyphs counter-rotate so they stay upright.
- Tiles stay for the round (reusable across words)
- Min word length: global floor **3**; per-game setup may raise to **4** or **5**
- No duplicate words per round
- Dictionary: [dolph/dictionary](https://github.com/dolph/dictionary) — **v1 play lexicon = `popular.txt`** (enable1 ∩ Wiktionary TV/movie frequency lists ≈ 25k common words; not a frequency CSV). Full `enable1` kept in the build artifact for a future “dictionary mode” but **does not** drive accept, board `allWords`, targets, or missed reveals. Plus **offensive/NSFW blocklist** (ENABLE public domain — attribute in README). Blocked tokens must not appear in validation, board gen, or missed-words.
- Scoring: `points = length - 2` (config constant)
- **Target**: countdown — `remaining` starts at achievable target (board max × Easy/Med/Hard); each accepted word subtracts its points; **win when remaining === 0** (“Clear the couch”). High scores still store **points earned**. Max/target use only words ≥ active min length.
- **Timed**: fixed board; 30/60/90/120s → results (score accumulates; unchanged)
- **Quit mid-game** (UI: **End run**) → results with progress so far (`won` | `timeout` | `quit`)

## Product surface

- **Home setup = game lobby** (not a settings form): mode as choice cards; board as visual grid/shape tiles; difficulty/duration as one expressive control; min word length collapsed under “Word length”; Scout for words-left HUD. Play dominates. See `.cursor/rules/ui.mdc`.
- Local profiles only (no cloud/export/sync); high scores per profile × grid × **topology** × mode × difficulty/duration. UI label: **Couch crew** (route may stay `/profiles`).
- **Potato Board** (personal local stats on Couch crew): games/words totals, bests with timestamps, recent runs (last 20). Not a cloud leaderboard. (“Alita Board” speech → this.)
- Web share from results (Web Share API + clipboard fallback)
- SEO: title/description/OG/Twitter + JSON-LD (`WebApplication` / `VideoGame`)
- PostHog stub (`VITE_PUBLIC_POSTHOG_KEY`); no-op without key
- Sounds: **[cuelume](https://cuelume-site.pages.dev/agents.md)** on web only; mute from **home or play HUD** icon toggles (`soundEnabled` prefs + `setEnabled`) — see `.cursor/skills/cuelume`
- **Words left** HUD (`showWordsLeft` device pref, default **off**): unfound valid words on the board (`allWords − found`), not target pts remaining; lobby Scout + play eye toggle
- **Chrome icons:** lucide for sound / rotate / couch crew / share / words-left eye (icon or icon+text); keep lobby mode/challenge as words+tiles — don’t icon-spam settings. Always `aria-label` on icon-only; web uses shadcn `IconTooltip` (game voice — see `.cursor/rules/ui.mdc`).

## Stack

- Bun workspaces (**catalog** for shared dep versions); Vitest; Vite + TanStack Router → Vercel
- **Format / lint:** `oxfmt` + `oxlint` (`bun run fmt` / `fmt:check` / `lint` / `check`) — not Prettier/ESLint unless already required
- **Dev procs:** `bun run mprocs` → `mprocs.yaml` (web + optional mobile / vitest / dict-build / typecheck / fmt / lint)
- **Web chrome:** prefer **shadcn/ui** (DOM) for buttons/inputs/toasts — Sage Garden tokens + Grandstander/Lexend. Game board stays custom (`LetterGrid`, path, confetti) in `packages/ui`.
- `packages/ui`: game + shared presentational (grid, loading/empty, logo); RN Button remains for Expo later — **web screens should not add a second hand-rolled chrome Button** once shadcn is wired.
- Loading / empty / 404–500 voice live in `packages/ui` (`LoadingPotato`, `EmptyState`) + thin web pages
- Pointer Events for swipe paths (web); Hammer.js = reference only
- CSS/NativeWind motion first; no anime.js unless a real gap
- Play chrome is tactile (cream pillow tiles, sage frame) — keep iterating polish; don’t regress to flat robot UI

## Code style

TPP DRY: one authoritative place per piece of knowledge. No over-abstraction, no one-export files. Engine decides; UI displays. Format with `oxfmt`; lint with `oxlint` (see `.cursor/rules/coding.mdc`).

## Agent UI verification (required)

UI work is **not done** until interactively verified in a running local app (pointer swipe across tiles — not click-only). See `.cursor/skills/verify-ui`. Engine-only → Vitest; UI → Vitest **and** interactive check.

**Mobile:** agent default is **Expo web** (`bun run mobile:web`) + Playwright smoke — see `.cursor/skills/verify-mobile`. Optional iOS Simulator boot when native launch matters. Full play QA remains on web until Expo play ships.

## Living agent docs

When the user locks a new decision, update `AGENTS.md` / `.cursor/rules/` / `.cursor/skills/` in the same turn. See `.cursor/skills/sync-agent-docs` and `.cursor/rules/agent-docs.mdc`.

## Out of scope (v1)

Hints, cloud, combos/multipliers, Next.js, Web Worker for gen, daily/streaks, fancy share images, real PostHog key.

## Pointers

- Rules: `.cursor/rules/` (`coding`, `agent-docs`, `ui`, `engine`)
- Skills: `.cursor/skills/` (`verify-ui`, `verify-mobile`, `cuelume`, `sync-agent-docs`, `new-mode-or-scoring`)
