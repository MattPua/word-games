---
name: verify-ui
description: Interactively verify UI/play changes in a running local web app with Playwright pointer swipes. Use after any UI or play-loop change before calling the work done.
---

# verify-ui

UI work is not done until exercised in a running app.

## Steps

1. Start `apps/web` (`bun run --filter @couch-potato/web dev` or root `bun run web`).
2. Open with Playwright / browser tools.
3. Exercise the changed flow:
   - **Play / grid:** pointer **down → move → up** across tile hit targets (not click-only).
   - Happy path + obvious failures touched (invalid word, duplicate, target reach, timer end).
   - Quit → results with progress so far when quit/results changed.
   - Share fallback / sounds when those areas changed.
   - Active icon toggles (background music, SFX): on-state glyph animates (not just ring/color), off-state stays static, and `prefers-reduced-motion: reduce` drops the animation while keeping ring/color — check via `page.emulateMedia({ reducedMotion })` or computed `animationName`, not just a screenshot.
4. Screenshots alone or “it compiles” do **not** count.

Engine-only changes: Vitest is enough. UI: Vitest **and** this interactive check.
