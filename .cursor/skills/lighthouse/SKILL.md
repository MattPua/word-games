---
name: lighthouse
description: >-
  Run Lighthouse audits for Couch Potato web (performance, accessibility, best
  practices, SEO) and drive scores toward ~100. Use when measuring Lighthouse,
  Core Web Vitals, performance budgets, or optimizing apps/web load. Adapted
  from christophacham/agent-skills-library perf-lighthouse.
---

# lighthouse

Goal: keep **all** Lighthouse category scores as close to **100** as practical on `apps/web` (lobby + key chrome routes). Prefer evidence from a **production build**, not Vite HMR.

Reference patterns: [perf-lighthouse](https://github.com/christophacham/agent-skills-library/blob/main/skills/web-dev/perf-lighthouse/SKILL.md) (CLI / budgets / LHCI / JSON parse).

## When to run

- After meaningful web perf, SEO, a11y, or asset changes
- Before claiming “perf is fine”
- When the user asks for Lighthouse / Core Web Vitals / score chase

## Tooling (this repo)

| Need                                 | Prefer                                                                                                              |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Accessibility / SEO / Best practices | `chrome-devtools` MCP `lighthouse_audit` against shared Chrome `:9222` (see `verify-ui`) — **excludes performance** |
| Performance + full categories        | CLI `lighthouse` (or `bunx lighthouse`) against a **preview** of `apps/web` build                                   |
| Trace / CWV deep dive                | `performance_start_trace` / `performance_stop_trace` (chrome-devtools)                                              |

Do **not** treat a cold `vite` HMR score as shipping truth. Build first:

```bash
bun run --filter @couch-potato/web build
bunx --cwd apps/web vite preview --host 127.0.0.1 --port 4173 --strictPort
```

## Target budgets (Couch Potato)

Aim for category scores **≥ 95**, stretch **100**. Soft resource budgets for the lobby cold load (adjust if product grows; document changes here):

| Resource          | Budget                                                                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Total transfer    | ≤ 500 KB                                                                                                                                               |
| Script            | ≤ 250 KB (gzip; lobby shell — Play/dict stay lazy). Lucide: per-icon via `vite.lucide-optimize` — don’t re-add a lucide barrel `optimizeDeps.include`. |
| Stylesheet        | ≤ 50 KB                                                                                                                                                |
| Image             | ≤ 300 KB (cropped **display-sized** cell WebPs ~160px logo / ~128px medals — never full sheets; prefer **WebP** — `AGENTS.md`)                         |
| Third-party count | ≤ 5                                                                                                                                                    |

**Offline / 3G:** production SW precache stays lean (shell CSS + latin fonts + tiny logos — not Play JS, medals, or BGM). Runtime `CacheFirst` for `/assets/*.js`, images, mp3 after first use. Don’t “fix” Lighthouse by precaching the whole app into install. Keep `menu-bgm.mp3` ~128 kb/s stereo without cover art (see `AGENTS.md` Sounds / skill `sfx`).

Timing (mobile, default Lighthouse throttling):

| Metric            | Budget    |
| ----------------- | --------- |
| FCP               | ≤ 1500 ms |
| LCP               | ≤ 2500 ms |
| TBT               | ≤ 200 ms  |
| CLS               | ≤ 0.1     |
| TTI / interactive | ≤ 3000 ms |

Primary URLs to sample:

1. `/` (lobby — first paint / LCP hero)
2. `/play` (heavier: board + engine + dict)
3. `/options`, `/achievements`, `/profiles`, `/results` (chrome pages)

Mobile form-factor first (stricter); desktop optional for regression.

## CLI quick start

```bash
# Full categories → JSON (parse scores + failed audits)
bunx lighthouse http://127.0.0.1:4173/ \
  --form-factor=mobile \
  --throttling-method=devtools \
  --output=json \
  --output-path=/tmp/cp-lh-lobby.json \
  --chrome-flags="--headless=new" \
  --quiet

# Perf-only pass (faster iterate)
bunx lighthouse http://127.0.0.1:4173/ \
  --preset=perf --form-factor=mobile \
  --output=json --output-path=/tmp/cp-lh-perf.json \
  --chrome-flags="--headless=new" --quiet
```

Optional budget file: `.cursor/skills/lighthouse/budget.json` — pass `--budget-path=.cursor/skills/lighthouse/budget.json`.

## chrome-devtools MCP (a11y / SEO / BP)

1. `.cursor/skills/verify-ui/scripts/ensure-chrome-debug.sh`
2. Navigate preview (or prod) URL in the shared browser
3. `lighthouse_audit` with `mode: "navigation"`, `device: "mobile"` (and desktop if needed)
4. Write reports under a temp dir or `/tmp/cp-lh-*`

Still run CLI for **performance** — MCP audit explicitly skips it.

## Parse & prioritize

From JSON (`lhr`):

```js
const scores = Object.fromEntries(
  Object.entries(report.categories).map(([k, c]) => [k, Math.round((c.score ?? 0) * 100)]),
);
const failed = Object.values(report.audits)
  .filter((a) => a.score !== null && a.score < 0.9)
  .map((a) => ({ id: a.id, score: a.score, title: a.title, displayValue: a.displayValue }));
```

Fix order:

1. **Category score killers** (any category ≪ 100)
2. **LCP / FCP / TBT / CLS** opportunities with real savings
3. **a11y** failures (contrast, names, landmarks) — never leave red
4. **SEO / best-practices** (meta, HTTPS-only in prod, image aspect, console errors)
5. Micro-optimizations that don’t fight game feel (don’t gut tactile board motion for 1pt)

## Product constraints (don’t “optimize” these away)

- Pixel-art mascots: `image-rendering: pixelated`; transparent brand marks; cream-matted `og` / apple-touch
- Play board stays custom + tactile; prefer CSS motion; honor `prefers-reduced-motion`
- Dictionary / engine payloads: size matters — measure before adding more client work; don’t invent Web Workers unless product unlocks that (AGENTS out of scope lists Worker for gen)
- Bun workspaces + Vite; no Next.js
- **Background music MP3:** must not fetch until music is actually enabled + scene wants play (`menuMusic.ts`) — constructing `Audio` with `preload=auto` on boot tanks LCP
- **Cold JS:** web is DOM + Tailwind only (no NativeWind / react-native-web). Eager how-to for cold redirect; lazy lobby; measure before adding client weight. Lexend cold path = 400 + 700 only.
- **Play lexicon:** ship ENABLE with a **dynamic** Play import (CacheFirst after first use); keep lobby cold path free of the dict. **Never idle-prefetch** `/play` on the lobby — that pulls ENABLE into the LH cold network and looks like multi‑MB “home” weight. Warm on Play hover/focus/click only
- **Lobby chill mark:** `/logo.webp` (LCP) — not bored `/logo-snore.webp` on `/`. Chrome site bar reuses small `/logo.webp` (not `/logo-mark.webp` crop).

## Score history (required)

Every full lobby (or route) CLI audit **appends** one row to [`.cursor/skills/lighthouse/history.json`](history.json) so we can see whether scores / transfer are going **up or down** over time.

1. Read the last entry for the same `url` + `formFactor` (if any).
2. After the run, append a new object (ISO-8601 `at`, local offset ok). Do **not** edit or delete prior rows.
3. In the user report, show **delta vs previous** for P / A / BP / SEO and `transferKiB` (e.g. `P 85 (+23 vs 2026-07-26)`).

Schema (one object per audit):

```json
{
  "at": "2026-07-26T17:28:00-04:00",
  "url": "/",
  "formFactor": "mobile",
  "build": "preview:4173",
  "scores": { "performance": 85, "accessibility": 100, "best-practices": 100, "seo": 100 },
  "transferKiB": 435,
  "fcp": "3.0 s",
  "lcp": "3.6 s",
  "tbt": "0 ms",
  "cls": 0.001,
  "note": "short why this run / what changed"
}
```

Optional fields (`fcp`, `lcp`, `tbt`, `cls`, `note`) when known. Skip appending for throwaway mid-fix iterates unless the user asked to log them — **do** append the baseline before a fix batch and the final after.

## Report back

Always include:

- URL + form-factor + build vs preview
- Category scores (P / A / BP / SEO) **and delta vs last history row** for that URL/form-factor
- `transferKiB` (+ timing if handy) with delta
- Top 3–5 failing audits with ids
- What you changed (if optimizing) + re-audit delta
- Confirmation that `history.json` was appended

## Sync docs

If budgets or the audit ritual lock as lasting convention, update `AGENTS.md` Pointers + this skill in the same turn (`.cursor/skills/sync-agent-docs`).
