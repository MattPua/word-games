---
name: verify-ui
description: Interactively verify UI/play changes in a running local web app with pointer swipes via chrome-devtools MCP (or Playwright when devtools can't do it). Use after any UI or play-loop change before calling the work done.
---

# verify-ui

UI work is not done until exercised in a running app.

## Browser: reuse the shared chrome-devtools instance

`chrome-devtools` MCP is configured with `--browserUrl=http://127.0.0.1:9222` (see `~/.cursor/mcp.json`), so every navigation opens a **tab in one shared Chrome**, not a new Chrome App instance per call.

1. Before using chrome-devtools MCP tools, ensure that Chrome is up: `.cursor/skills/verify-ui/scripts/ensure-chrome-debug.sh` (idempotent — no-ops if already running). If it's not running yet, that script starts it once with the matching `--remote-debugging-port=9222` / dedicated profile.
2. Prefer chrome-devtools MCP over spawning a Playwright browser — don't launch a second automation browser just because it's the more familiar tool. Only reach for Playwright when devtools genuinely can't do the job (e.g. a capability devtools lacks).
3. Only one agent/session should drive browser QA at a time — check `list_pages` first; if another run's tabs are already open (e.g. a WIP layout check), don't close them out from under it, add your own tab or wait.
4. This is a real, visible Chrome window (not headless) — closing it manually is fine; the next tool call relaunches it via the script/singleton check.

## Steps

1. Start `apps/web` (`bun run --filter @couch-potato/web dev` or root `bun run web`).
2. Open with chrome-devtools MCP (fallback: Playwright) against the shared browser above.
3. Exercise the changed flow:
   - **Play / grid:** pointer **down → move → up** across tile hit targets (not click-only).
   - Happy path + obvious failures touched (invalid word, duplicate, target reach, timer end).
   - Quit → results with progress so far when quit/results changed.
   - Sounds when those areas changed.
   - Active icon toggles (background music, SFX): on-state glyph animates (not just ring/color), off-state stays static, and `prefers-reduced-motion: reduce` drops the animation while keeping ring/color — check via `page.emulateMedia({ reducedMotion })` or computed `animationName`, not just a screenshot.
4. Screenshots alone or “it compiles” do **not** count.

Engine-only changes: Vitest is enough. UI: Vitest **and** this interactive check.

Before shipping any **chrome page** (lobby, Couch crew, Results, Achievements / Couch medals, **Options**, similar — not play), also check at ~1280 width:

1. **Desktop real estate** — widens + multi-col (see `.cursor/rules/ui.mdc`), not a lonely `max-w-md` stick with huge side margins.
2. **No full-bleed CTAs** — Back to lobby / Play again / primary actions hug content (`.cp-chrome-cta`), not stretch across the wide shell.
3. **No huge empty tops** — content starts under Shell safe-area padding; no accidental `min-h-full` + `justify-center` on short chrome.
4. **Options** specifically: prefs grid fills the wide shell; Lobby jam + Back to lobby visible without scroll on a typical desktop height (~800px).

## Layout bugs (clipping, overflow, sticky footers, safe-area)

Prefer **chrome-devtools MCP** over Playwright for these — it gives DevTools-level
evidence instead of guessing from screenshots alone:

- `resize_page` across the actual widths in play (e.g. 390 / 768 / 1024 / 1280), then
  `evaluate_script` to read `getBoundingClientRect()` / `scrollWidth` vs `innerWidth`
  on the suspect elements (root, `Shell`, scroller, sticky footer) — confirms _where_
  the overflow or clipped box actually is, not just that a screenshot looks off.
- Check computed `overflow` up the ancestor chain (root `h-dvh overflow-hidden`,
  `Shell`, scroll region) — a clip can live on a parent, not the element you edited.
- `dvh` / safe-area issues: check `env(safe-area-inset-*)` and that the sticky
  element (not an ancestor) owns the bottom padding.
- Take `take_screenshot` at each width as evidence once the numbers check out.

Playwright is still fine for interaction smoke (pointer swipes, click flows) — use
chrome-devtools MCP first to actually diagnose a layout/clipping bug.
