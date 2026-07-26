---
name: posthog-analytics
description: >-
  Instrument Couch Potato game-loop analytics via PostHog (tutorial, lobby
  settings, runs started/finished/quit, session counts, haul quality,
  replayability). Use when adding, changing, or reviewing product analytics
  events, PostHog capture, or funnels for play/how-to/options.
---

# posthog-analytics

Web-only product analytics + error tracking through `apps/web/src/analytics.ts`. **No-op** without a real `VITE_PUBLIC_POSTHOG_KEY` (placeholder keeps SDK off the cold path). Do not ship capture that pulls `posthog-js` into lobby/how-to unless init already ran.

Official SDK patterns: PostHog skills `instrument-product-analytics` / `instrument-error-tracking` (generic). This skill owns **Couch Potato event names + where to fire**.

## Wire

```ts
import {
  track,
  captureError,
  setPlayVia,
  launchAnalyticsProps,
  trackOptionsPrefChanged,
  trackWordRejected,
} from "../analytics";

track("event_name", { mode: "goal", grid: 4 });
setPlayVia("lobby"); // before navigate to /play
captureError(err, { surface: "router_error" });
```

- Always `track` / `captureError` — never import `posthog-js` from pages.
- Props: `string | number | boolean | null` only (`AnalyticsProps`).
- Init sets `capture_exceptions: true` (unhandled errors + rejections → `$exception`).
- Product events **queue until SDK ready** (same as exceptions) so lobby Play isn’t dropped.
- Router / caught failures: `captureError`. `ErrorPage` reports `surface: "router_error"`.
- Fire on **user intent / outcomes**, not every pointer move or React render.
- Enrich run events with lobby launch shape: `launchAnalyticsProps(...)` → `mode`, `grid`, `topology`, `min_word_length`, plus `difficulty` | `duration`.
- **`game_started` fires once** when the board is ready in `PlayPage.beginFreshRun` (not on lobby click alone). Callers set `setPlayVia("lobby" | "results" | "howto" | "restart")` before navigate / restart.
- Session depth: `nextSessionRun()` on each start → `session_run` (1-based tab session). PostHog `$session_id` still owns sessions — don’t reinvent.
- Profiles are local-only — **don’t** `identify()` on display names. Anonymous + `person_profiles: "identified_only"` stays.
- Never put dictionary word lists, full board letters, or PII in props. `word_found.word` is ok (single token).

## Priority (ship order)

1. **Run outcome quality** — enrich `game_started` / `game_completed` (balance, quit reasons).
2. **Replay / session depth** — `session_run`, `via`, `play_again`, `restart_mid_run`, `last_results_opened`.
3. **Tutorial funnel** — `howto_*`.
4. **In-run friction** — throttled `word_rejected`, `seconds_to_first_word`, `board_cleared`.
5. **Progression** — `medal_stage_up`, `personal_best`.
6. **Prefs** — `options_pref_changed`, `lobby_jam_invite`.

## Core loop events

| Event | When | Key props |
| --- | --- | --- |
| `howto_skipped` | How-to **Skip** → lobby | `step_index`, `step_id` |
| `howto_completed` | Last step → done (`via: "done"`) **or** **Play a run** (`via: "play_run"`) | `via` |
| `howto_step_nabbed` | Player nabbed target word on a how-to step | `step_id`, `step_index`, `word` |
| `game_started` | Board ready after lobby / results / how-to / restart | launch props + `via`, `session_run`, `board_words`, `board_max_score`, `banned_words` |
| `game_completed` | Run → results (`won` \| `timeout` \| `quit`) | launch + `reason`, `score`, `words`, `session_run`, `play_seconds`, `board_words`, `board_max_score`, `found_pct`, `words_left`, `longest_word`, `avg_word_len`, `target`, `cleared_pct`, `rotates`, `pause_opens`, `board_cleared`, `personal_best`, `seconds_to_first_word`, survival peak/bonus when mode=survival |
| `word_found` | Accepted swipe | `word`, `points`, `length`, `first`, `seconds_to_first_word` (when first) |
| `word_rejected` | Invalid submit (short/invalid/duplicate) — **throttled 2s** via `trackWordRejected` | `reason` |
| `board_cleared` | Every solvable word nabbed | launch-ish + `words` |
| `play_again` | Results **Play again** | `mode`, `grid`, `topology` |
| `restart_mid_run` | Couch break **Restart** (no haul) | launch + `session_run` |
| `last_results_opened` | Lobby haul icon or palette **Last haul** | `from`: `"lobby"` \| `"palette"` |
| `medal_stage_up` | Each new stage from `recordFinishedRun` | `track_id`, `stage`, `milestone` |
| `personal_best` | New high score for that key | `mode`, `grid`, `score` |
| `lobby_jam_invite` | Soft invite **Cue the jam** / **Maybe later** | `action`: `"cue"` \| `"dismiss"` |
| `options_pref_changed` | Options / Couch break / command palette pref flip | `pref`, `value` (`look`, `type`, `words_left`, `sfx`, `lobby_jam`) |

### Quit / leave

- Mid-run **End run** → `game_completed` with `reason: "quit"` (no duplicate `game_quit`).
- Early bail (&lt;3s) → lobby, **no** `game_completed`.
- Soft abandon (`pagehide` mid-run): optional later `game_abandoned` — not required for v1.

### Volume

| Keep | Avoid / sample |
| --- | --- |
| howto_*, game_started, game_completed, play_again, restart_mid_run, options_pref_changed, medal_stage_up | Per-tile pointer events |
| `word_found` | Reject spam — use `trackWordRejected` only |
| `board_cleared` (rare) | Full `allWords` / missed lists |

## Checklist when adding a surface

1. Read this skill + `rg 'track\\(' apps/web`.
2. Pick an event from the table (or add one row here + one-liner in `AGENTS.md` PostHog bullet).
3. Call `track` at the outcome site; for new play entries use `setPlayVia` then let `beginFreshRun` emit `game_started`.
4. Confirm no-key path still no-ops.
5. Don’t block UX on analytics (fire-and-forget; never `await` network).

## Funnels worth building in PostHog

1. **First session:** how-to open → `howto_completed` \| `howto_skipped` → `game_started` → `game_completed`
2. **Retention / replay:** `session_run` ≥ 2; `play_again`; next-day `game_started`
3. **Setup taste:** breakdown `game_started` by `mode`, `grid`, `topology`, `difficulty`/`duration`, `min_word_length`, `via`
4. **Churn mid-run:** `game_completed` where `reason = quit` vs `won`/`timeout`; correlate `found_pct`, `seconds_to_first_word`, `words_left`
5. **Difficulty health:** Goal `cleared_pct` / Timed score density (`score / play_seconds`) by `difficulty` × `grid`
6. **Progression:** `medal_stage_up` → later `game_started`

## Env

`apps/web/.env.example`:

```
VITE_PUBLIC_POSTHOG_KEY=phc_placeholder
VITE_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
# POSTHOG_PERSONAL_API_KEY=   # build-time source maps (Error tracking write)
# POSTHOG_PROJECT_ID=
```

- Client key in local `apps/web/.env.local` + Vercel — never commit. `.env.example` keeps `phc_placeholder`.
- **Source maps:** production `vite build` uploads when `POSTHOG_PERSONAL_API_KEY` + `POSTHOG_PROJECT_ID` are set (Vercel build env). Personal key ≠ project `phc_` token.

## Error tracking

- Autocapture via `capture_exceptions: true` in `initAnalytics`.
- Manual: `captureError` from router `ErrorPage` (and any caught critical paths).
- Confirm `$exception` in PostHog Activity / Error tracking after deploy.

## Anti-patterns

- Importing `posthog-js` from pages or shared `packages/ui`
- Identifying Couch crew display names as distinct ids
- Capturing full `allWords` / missed lists
- New parallel analytics helpers beside `analytics.ts` exports
- Firing `game_started` on lobby click **and** board ready (double count) — board ready only
- Treating chat-only event names as source of truth — update this skill when the catalog changes
- Uploading source maps with the public `phc_` key (needs a **personal** API key)
