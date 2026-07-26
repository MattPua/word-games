---
name: loading-empty
description: Quirky Couch Potato loading/empty states — prefer layout skeletons when the UI shape is known; EmptyState + LoadingPotato voice. Use when adding spinners, Suspense fallbacks, empty lists, or skeleton placeholders.
---

# loading-empty

Authoritative detail: `.cursor/rules/ui.mdc` → **Loading / empty / skeletons**.

## Pick the right surface

| Situation | Use |
| --- | --- |
| True void (no profiles, zero haul, no last run) | `EmptyState` — quirky title + optional body |
| Wait where layout is known (crew, medals, options, results chrome) | **Skeleton** mirroring real rows/cards/columns |
| Wait with no chrome yet (bare route before shell) | `LoadingPotato` + whimsical message |
| Play start (lazy chunk / board gen) | `PlaySkeleton` — HUD + board tiles matching launch size **and** topology (square grid or honeycomb clip) |

## Checklist

1. **Copy** — game voice, no sterile “Loading…” / “No data”. No em dashes.
2. **Skeleton first** for chrome pages — same shell / columns / card footprints; muted pulse; `prefers-reduced-motion` = static.
3. **shadcn `Skeleton`** once in `apps/web/src/components/ui` — don’t hand-roll a second primitive.
4. **EmptyState** — don’t double-mascot under `BrandHeader` (`showLogo` only when no brand mark).
5. **Top-align** — no `min-h-full` + `justify-center` for short empty/loading chrome.
6. Replace route-level `LoadingPotato` Suspense with a page skeleton when that route’s IA is settled.
