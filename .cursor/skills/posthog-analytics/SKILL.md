---
name: posthog-analytics
description: >-
  Instrument Couch Potato game-loop analytics via PostHog (tutorial, lobby
  settings, runs started/finished/quit, session counts). Use when adding,
  changing, or reviewing product analytics events, PostHog capture, or
  funnels for play/how-to/options.
---

# posthog-analytics

Web-only product analytics through `apps/web/src/analytics.ts`. **No-op** without a real `VITE_PUBLIC_POSTHOG_KEY` (placeholder keeps SDK off the cold path). Do not ship capture that pulls `posthog-js` into lobby/how-to unless init already ran.

Official SDK patterns: PostHog skill `instrument-product-analytics` (generic). This skill owns **Couch Potato event names + where to fire**.

## Wire

```ts
import { track } from "../analytics";

track("event_name", { mode: "goal", grid: 4 });
```

- Always `track(name, props)` — never import `posthog-js` from pages.
- Props: `string | number | boolean | null` only (see `track` signature).
- Fire on **user intent / outcomes**, not every pointer move or React render.
- Enrich run events with lobby launch shape when known: `mode`, `grid`, `topology`, `difficulty` | `duration`, `minWordLength`.
- Session depth: bump a `sessionStorage` counter on each `game_started`; attach `session_run` (1-based) on start/complete. PostHog already has `$session_id` — don’t reinvent sessions.
- Profiles are local-only — **don’t** `identify()` on display names. Anonymous + `person_profiles: "identified_only"` stays.
- Never put dictionary word lists, full board letters, or PII in props. `word_found.word` is ok (single token).

## Core loop events (ship these)

| Event | When | Key props |
| --- | --- | --- |
| `howto_skipped` | How-to **Skip** → lobby | `step_index`, `step_id` (0-based step left on) |
| `howto_completed` | How-to done CTA **Play a run** *or* finish all steps into done state | `via`: `"play_run"` \| `"done"` |
| `howto_step_nabbed` | Player nabbed target word on a how-to step | `step_id`, `step_index`, `word` |
| `game_started` | Lobby **Play** (and how-to **Play a run** if it launches) | launch prefs + `session_run` |
| `game_completed` | Run reaches results (`won` \| `timeout` \| `quit`) | `reason`, `score`, `words`, launch prefs, `session_run`, `play_seconds` if cheap |
| `lobby_jam_invite` | Lobby soft invite **Cue the jam** / **Maybe later** | `action`: `"cue"` \| `"dismiss"` |
| `options_pref_changed` | Options / Couch break / command palette flips a device pref | `pref`, `value` (Look, Type, Words left, SFX, Lobby jam) |
| `lobby_setup_changed` | Optional: mode / board / challenge / min-length card change | `field`, `value` — or rely on `game_started` props only (prefer fewer events) |

**Already partially wired:** `game_started` (Home), `game_completed` + `word_found` (Play). Extend props; add missing tutorial/options/quit clarity.

### Quit / leave

- Mid-run **End run** → still `game_completed` with `reason: "quit"` (don’t add a duplicate `game_quit` unless you need a separate funnel step).
- Soft abandon (tab close / navigate away mid-run without End run): optional `game_abandoned` on `pagehide`/`beforeunload` if a run is open — keep props tiny; fire at most once per run.

### Volume

| Keep | Avoid / sample |
| --- | --- |
| howto_*, game_started, game_completed, options_pref_changed | Per-tile pointer events |
| `word_found` (useful for haul depth) | Reject spam every bad swipe — skip or throttle |
| | Route `$pageview` only if autocapture off and you need funnels |

## Checklist when adding a surface

1. Read this skill + current `track(` call sites (`rg 'track\\(' apps/web`).
2. Pick an event from the table (or add one row here + a one-liner in `AGENTS.md` PostHog bullet).
3. Call `track` at the outcome site (storage write / navigate / `setHowToSeen`), not in pure render.
4. Confirm no-key path still no-ops (dev without `.env` key).
5. Don’t block UX on analytics (fire-and-forget; never `await` network).

## Funnels worth building in PostHog

1. **First session:** `$pageview` / how-to open → `howto_completed` | `howto_skipped` → `game_started` → `game_completed`
2. **Retention proxy:** `game_started` count per `$session_id` / per day
3. **Setup taste:** breakdown `game_started` by `mode`, `grid`, `topology`, `difficulty`/`duration`, `minWordLength`
4. **Churn mid-run:** `game_completed` where `reason = quit` (+ optional `game_abandoned`) vs `won`/`timeout`

## Env

`apps/web/.env.example`:

```
VITE_PUBLIC_POSTHOG_KEY=phc_placeholder
VITE_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

Real key in local `apps/web/.env.local` (gitignored) and Vercel project envs — never commit. `.env.example` keeps `phc_placeholder`.

## Anti-patterns

- Importing `posthog-js` from pages or shared `packages/ui`
- Identifying Couch crew display names as distinct ids
- Capturing full `allWords` / missed lists
- New parallel analytics helpers beside `track`
- Treating chat-only event names as source of truth — update this skill when the catalog changes
