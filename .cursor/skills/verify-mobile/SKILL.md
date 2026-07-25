---
name: verify-mobile
description: Verify Expo mobile smoke — default Expo web + Playwright; optional iOS Simulator boot. Use after mobile/shared-UI changes, not instead of verify-ui for web play.
---

# verify-mobile

Agent-testable mobile QA for `@couch-potato/mobile`. Prefer tools the agent can drive (Playwright, shell). Not a device farm.

## Default (agent): Expo web

Fastest interactive path — reuses Playwright like `verify-ui`.

1. `bun run mobile:web` (or `bun run --filter @couch-potato/mobile web`) from repo root.
2. Open the Expo web URL (usually `http://localhost:8081`).
3. Confirm smoke UI: **Couch Potato**, **Expo smoke OK**, `scoreWord`, `dict.has`, `applyPathCell` lines render (workspace imports alive).
4. Screenshots alone aren’t enough — read the on-screen values.

**Tradeoff:** Expo web ≠ native layout/NativeWind/gesture fidelity. Good for “app boots + monorepo imports.” Full play swipe still lives on `apps/web` + `verify-ui`.

## Optional: iOS Simulator boot

This machine often has Xcode sims; Android/adb may be absent. Maestro/Detox are not required.

```sh
# Boot a sim then Expo iOS (slow; use when native boot matters)
xcrun simctl boot "iPhone 16" 2>/dev/null || true
bun run --filter @couch-potato/mobile ios
```

Confirm the app launches (Expo Go or dev client). Limited automation — visual/smoke only.

## When to use which

| Goal | Path |
|------|------|
| Agent daily mobile smoke | **Expo web** + Playwright |
| Shared UI play / swipe | `apps/web` + `verify-ui` |
| Native boot regression | iOS Simulator (optional) |

NativeWind-styled Expo UI and Detox/Maestro: deferred until play ships on mobile.
