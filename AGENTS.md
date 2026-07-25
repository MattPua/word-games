# Couch Potato

Swipe adjacent letters on a square or honeycomb grid. Casual word game — short sessions, fast first success, no hints.

## Brand

- Name: **Couch Potato** — pixel potato-on-couch PNG (`packages/ui/src/logo.png`; web `/logo.png`). Brand mark + favicon: **transparent** (cream-matted alpha — not black RGB under alpha). `apple-touch-icon.png` / `og.png`: same art on **opaque cream** (platforms paint transparent as black).
- **Sprite sheet:** `packages/ui/src/logo-sprite.png` (web `/logo-sprite.png`) + `logo-sprite.json` + `spriteAtlas.ts` — AI-generated, cropped into a clean 2-col × 1-row atlas (506×512 equal cells: idle chill | cheer, arms up + sparkles), transparent bg, same pixel style as `logo`/`logo-celebrate`. Wired via `PotatoSprite` (`packages/ui`): pinned `frame` prop for deterministic poses (results win = cheer, quit/timeout = idle) or omit `frame` for the interactive hover/tap-poke mascot (404/empty-state). Not pixel-identical to the hand-tuned marks — re-run through PixelLab if a use needs true 1:1 frames. Prompt/atlas/QC conventions for generating or adding sprite frames: `.cursor/skills/potato-sprites`.
- Whimsical **light-first** (+ soft dark); Sage Garden tokens (tweaked); **Pixelify Sans** (display — pixel-adjacent, rhymes with the pixel-art logo) + **Lexend** (body/tiles, stays non-pixel for readability). Palette sampled + locked from the logo mascot (olive sage, muted tan potato gold) — see `.cursor/rules/ui.mdc` token roles.
- **Color roles:** `primary` = sage (actions, path); `secondary` = potato gold (badges, selected lobby cards, secondary buttons); `accent` = soft sage wash; `muted` = soft sage-gray surfaces. Prefer `bg-secondary` / `text-secondary` over ad-hoc potato hex. See `.cursor/rules/ui.mdc`.
- Mobile-first; play/results = centered narrow `max-w-md` column; **web lobby** widens on md+ (`cp-shell-lobby` — see `.cursor/rules/ui.mdc`)
- **Container queries = web-only**; shared layout uses flex + max-width
- **Viewport shell:** root `h-dvh` + `Shell` column; scroll in `flex-1 min-h-0 overflow-y-auto cp-shell-scroll` (stable gutter — cards clear the bar); sticky actions (lobby Play) outside the scroller — see `.cursor/rules/ui.mdc`
- **Motion:** meaningful interactivity should show the change (short CSS/NativeWind transitions — segments, presses, score ticks, screen enters). Whimsical + performant; few intentional motions, not noise; respect `prefers-reduced-motion`. No anime.js unless CSS can’t cover it. **Active icon toggles** (background music, SFX) animate the glyph itself while on (note bob / speaker pulse), not just color/ring — see `.cursor/rules/ui.mdc`.
- **UI inspiration:** [TypeUI](https://www.typeui.sh/) principles (tokens first → hierarchy / type rhythm / interaction feedback) + tactile word-game craft (pillow cream tiles, thick sage board frame, path + select rings, word pill + potato score badge). Keep cream/sage/potato — never purple demo clones. See `.cursor/rules/ui.mdc`.
- **Copy / voice:** prefer **gaming terminology** (Play, lobby, run, haul, SFX, spin) over sterile app/form words (Submit, Settings, Confirm). Whimsical Couch Potato: clear for casual players, not esports jargon. **No em dashes** in player-facing copy (see `.cursor/rules/ui.mdc`). Icon tooltips match.

## Game rules (engine owns these)

- Grids 4×4 / 5×5 / 6×6; topology **square** (8-way) or **hex / Honeycomb** (6-way odd-r); **no tile reuse in one swipe**
- **Rotate:** same letters, new view — **90°** CW or CCW (separate controls). Letters-only remap (never re-gen). **Square:** CSS board spin (~300ms) then remap; input locked mid-spin only — unlock on animation end (no extra beat). Glyphs counter-rotate so they stay upright. **Frame chrome + box-shadow stay on non-rotating `.cp-board-frame`**; only inner `.cp-board-spin` transforms (idle `transition: none` so angle remap doesn’t reverse-spin). **Hex / reduced-motion:** instant remap (90° container spin can’t land on odd-r honeycomb).
- Tiles stay for the round (reusable across words)
- Min word length: global floor **3**; per-game setup may raise to **4** or **5**
- No duplicate words per round
- Dictionary: [dolph/dictionary](https://github.com/dolph/dictionary) — **v1 play lexicon = `popular.txt`** (enable1 ∩ Wiktionary TV/movie frequency lists ≈ 25k common words; not a frequency CSV). Full `enable1` kept in the build artifact for a future “dictionary mode” but **does not** drive accept, board `allWords`, targets, or missed reveals. Plus **offensive/NSFW blocklist** (ENABLE public domain — attribute in README). Blocked tokens must not appear in validation, board gen, or missed-words.
- **Board letter mix scales with difficulty** (`LETTER_VARIETY` in `config.ts`): common-biased `LETTER_WEIGHTS` get flattened per-tile (`letterMixWeights`) and already-placed letters get docked so one board doesn't over-repeat. Easy stays common-biased with just enough anti-repeat to avoid mono-vowel soup; Medium balances common + uncommon; Hard leans into rarer letters and penalizes repeats harder for real variety pressure. Timed has no difficulty knob — defaults to the Medium mix. Never overrides gen thresholds — a spicier mix that can't produce enough words still loses to the best-effort fallback board.
- Scoring: `points = length - 2` (config constant)
- **Goal** (UI; engine `mode: "target"`): countdown — `remaining` starts at achievable target (board max × Easy/Med/Hard); each accepted word subtracts its points; **win when remaining === 0** (“Clear the couch”). High scores still store **points earned**. Max/target use only words ≥ active min length. Lobby card: Goal / Clear the couch, not “High score” (collides with Timed haul / Potato Board bests).
- **Timed**: fixed board; 30/60/90/120s → results (score accumulates; unchanged). Lobby: Timed / Beat the clock.
- **Survival** (UI; engine `mode: "survival"`): countdown clock, no points target — starts at `SURVIVAL_START_SECONDS[difficulty]` (Easy generous, Hard stingy, `config.ts`); each accepted word refills it via `survivalBonusSeconds(points, difficulty)` = `points * SURVIVAL_SECONDS_PER_POINT * SURVIVAL_BONUS_MULTIPLIER[difficulty]`, rounded, floored at `SURVIVAL_MIN_BONUS_SECONDS` (never a 0s refill); ends `timeout` when the clock hits 0 (reuses `tickTimer`, same as Timed). Points still accumulate for haul/high scores. Difficulty picker reused from Goal (**How hard?**, not duration chips). Lobby: Survival / Keep the clock fed. High scores keyed by mode × difficulty like Goal.
- **Quit mid-game** (UI: **End run**) → results with progress so far (`won` | `timeout` | `quit`)
- **Pause menu** (play): Escape or HUD pause → **Couch break** overlay — Switch rows for SFX / Background music / Words left / Dark mode (+ End run); pauses timed clock + blocks grid swipe until Resume / second Escape

## Product surface

- **Home setup = game lobby** (not a settings form): **Primary** — mode cards, board picker (size + Square/Honeycomb), challenge (How hard? / How long?). **Advanced** (quieter fine-tune) — Min length choice cards (helper + 3+/4+/5+ hints), Show words left Switch. Phone: stack primary then advanced. Wide web: primary left | advanced right; cards hug content. Play dominates; sticky Play bar = Play + background music + SFX only (no theme toggle); narrows on md+ lobby (centered cluster, not full shell width). **Dark mode** Switch lives on **Couch crew** (`/profiles`, Moon icon + helper; default system, explicit light/dark override); optional duplicate in Couch break mid-run. See `.cursor/rules/ui.mdc`.
- Local profiles only (no cloud/export/sync); high scores per profile × grid × **topology** × mode × difficulty/duration. UI label: **Couch crew** (route may stay `/profiles`).
- **Potato Board** (personal local stats on Couch crew): games/words totals, bests with timestamps, recent runs (last 20). Not a cloud leaderboard. (“Alita Board” speech → this.)
- Web share from results (Web Share API + clipboard fallback)
- SEO: strings in `apps/web/src/seo.ts` (cold-load via Vite `transformIndexHtml` → `index.html`; per-screen titles via TanStack Router `head` + `HeadContent`). JSON-LD `WebApplication` / `VideoGame`.
- PostHog stub (`VITE_PUBLIC_POSTHOG_KEY`); no-op without key
- Sounds: **[cuelume](https://cuelume-site.pages.dev/agents.md)** SFX on web only; mute from **home, play HUD, or pause menu** (`soundEnabled` prefs + `setEnabled`) — see `.cursor/skills/cuelume`. Word accept/reject: length-escalating accept + soft `error` on invalid submit (not empty cancel). **Background music** (`public/audio/menu-bgm.mp3`, `menuMusicEnabled`) loops on home / couch crew / play (quieter bed under SFX on `/play`; fades out on results); Couch break mute/unmute mid-run; separate toggle from SFX
- **Status pill heat:** Goal pill escalates muted → sage/`path` → potato `secondary` with clear progress (`1 − remaining/target`); brief pulse on clear. Timed timer stays calm until clock runs low, then shifts to destructive terracotta urgency (warn ≤ min(20s, 30% duration), critical ≤ min(10s, 15% duration)); brief pulse on tier step; `prefers-reduced-motion` = color only. **Survival** reuses the same timer pill + urgency thresholds (baseline = that difficulty's `SURVIVAL_START_SECONDS`, not the live refilled total) and adds a brief potato `+Ns` badge beside the pill on accept (`.cp-survival-bump`, `cp-catch-in` motion). See `.cursor/rules/ui.mdc` Play HUD.
- **Words left** HUD (`showWordsLeft` device pref, default **off**; UI: **Show words left**): unfound valid words on the board (`allWords − found`), not target pts remaining; toggle in lobby + Couch break only — play HUD shows muted “N left” readout when on (no eye in the HUD cluster)
- **Chrome icons:** prefer lucide for controls/options (sound / background music / pause / rotate / couch crew / share; lobby mode/challenge/board/word length/words left). Always `aria-label` on icon-only; web uses shadcn `IconTooltip` (game voice; see `.cursor/rules/ui.mdc`). Icon-only sizes share `.cp-icon-btn` hover/press/on motion. **Active/selected/on** must be obvious: potato `secondary` or sage `primary` icon color (+ soft fill), ring, and weight, not muted grey with a border-only change. Words-left eye lives in Couch break + lobby Words left row, not the play HUD cluster.

## Stack

- Bun workspaces (**catalog** for shared dep versions); Vitest; Vite + TanStack Router → Vercel
- **Format / lint:** `oxfmt` + `oxlint` (`bun run fmt` / `fmt:check` / `lint` / `check`) — not Prettier/ESLint unless already required
- **Dev procs:** `bun run mprocs` → `mprocs.yaml` (web + optional mobile / vitest / dict-build / typecheck / fmt / lint)
- **Web chrome:** prefer **shadcn/ui** (DOM) for buttons/inputs/toasts — Sage Garden tokens + Pixelify Sans/Lexend. Game board stays custom (`LetterGrid`, path, confetti) in `packages/ui`.
- `packages/ui`: game + shared presentational (grid, loading/empty, logo); RN Button remains for Expo later — **web screens should not add a second hand-rolled chrome Button** once shadcn is wired.
- Loading / empty / 404–500 voice live in `packages/ui` (`LoadingPotato`, `EmptyState`) + thin web pages
- Pointer Events for swipe paths (web); Hammer.js = reference only
- CSS/NativeWind motion first; no anime.js unless a real gap
- Play chrome is tactile (cream pillow tiles, sage frame) — keep iterating polish; don’t regress to flat robot UI

## Code style

TPP DRY: one authoritative place per piece of knowledge. No over-abstraction, no one-export files. Engine decides; UI displays. Format with `oxfmt`; lint with `oxlint` (see `.cursor/rules/coding.mdc`).

**Commits:** [Conventional Commits](https://www.conventionalcommits.org/) — imperative subject, concise. Types: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`; optional scope: `feat(engine):`, `fix(play):`. Examples: `fix(play): stop last-catch from shrinking the board`; `feat(engine): vary board letters by difficulty`; `docs: document shared chrome-devtools browser`; `style(ui): remove hard bezel from switch rows`. Don't rewrite history to fix old messages.

## Agent UI verification (required)

UI work is **not done** until interactively verified in a running local app (pointer swipe across tiles — not click-only). See `.cursor/skills/verify-ui`. Engine-only → Vitest; UI → Vitest **and** interactive check.

**Browser QA:** `chrome-devtools` MCP is configured (`~/.cursor/mcp.json`) to attach to one shared debuggable Chrome (`--browserUrl`, port 9222) instead of launching a new Chrome App per call — see `.cursor/skills/verify-ui` for the start script and etiquette (reuse it, don't spin up a parallel Playwright browser when devtools suffices, don't fight another run's open tabs).

**Mobile:** agent default is **Expo web** (`bun run mobile:web`) + Playwright smoke — see `.cursor/skills/verify-mobile`. Optional iOS Simulator boot when native launch matters. Full play QA remains on web until Expo play ships.

## Living agent docs

When the user locks a new decision, update `AGENTS.md` / `.cursor/rules/` / `.cursor/skills/` in the same turn. See `.cursor/skills/sync-agent-docs` and `.cursor/rules/agent-docs.mdc`.

## Out of scope (v1)

Hints, cloud, combos/multipliers, Next.js, Web Worker for gen, daily/streaks, fancy share images, real PostHog key.

## Pointers

- Rules: `.cursor/rules/` (`coding`, `agent-docs`, `ui`, `engine`)
- Skills: `.cursor/skills/` (`verify-ui`, `verify-mobile`, `cuelume`, `sync-agent-docs`, `new-mode-or-scoring`, `potato-sprites`)
