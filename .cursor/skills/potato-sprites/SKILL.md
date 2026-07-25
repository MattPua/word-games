---
name: potato-sprites
description: Generate or update pixel potato mascot art (logo marks, sprite sheets, atlas frames). Use when adding a new mascot pose/frame, redoing existing brand art, or wiring a sprite sheet into a component.
---

# potato-sprites

Workflow patterns adapted from [agent-sprite-forge](https://github.com/0x0funky/agent-sprite-forge) (MIT) —
a Codex skill for game sprite-sheet generation. We don't vendor its Python/chroma-key pipeline (our art comes
from **PixelLab** with a transparent export, not magenta-knockout `image_gen`), just the parts that transfer:
grid-sheet prompting discipline, atlas-over-loose-PNGs, and pre-accept QC gates.

## Current assets (source of truth, don't re-describe elsewhere)

| File                                                                      | Size                                    | Use                                                                                                                    |
| ------------------------------------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `packages/ui/src/logo.png`                                                | 256×256                                 | Chill mascot — brand mark, favicon, lobby `Logo`                                                                       |
| `packages/ui/src/logo-celebrate.png`                                      | 256×256                                 | Mid-celebration — results hero `LogoCelebrate`                                                                         |
| `packages/ui/src/logo-sprite.png` + `logo-sprite.json` + `spriteAtlas.ts` | 1012×512, 2 cols × 1 row, 506×512 cells | idle/cheer atlas — `PotatoSprite` pinned `frame` (results win/quit) or interactive hover-poke mascot (404/empty-state) |

All web-served copies live in `apps/web/public/` (same filenames) — copy after every regen, don't hand-diverge.
`spriteAtlas.ts` is the TS source of truth for frame rects; `logo-sprite.json` is a plain-data mirror for
non-TS tooling. Keep both in sync — never let the JSON drift from the TS map.

## When to add a frame vs a new standalone mark

- **One-off pose, no animation** (chill lobby, celebrate hero): standalone PNG like `logo.png` /
  `logo-celebrate.png`, wired through a dedicated `Logo`-style component.
- **Two or more poses that should share one image / CSS-step or cycle** (idle↔cheer nudge, a future
  quit/timeout muted pose, a loading spin): one sprite sheet + atlas map, not N loose PNGs. Prefer the sheet
  once you're past a single pose — atlas metadata (rects, cell size) is cheap; N hand-positioned `<img>` tags
  that must all agree on scale/anchor are not.
- Likely next frames, in priority order: results **quit/timeout** (subdued, no sparkles — pairs with the
  existing cheer), **loading/spin** (for `LoadingPotato`), a **couch-break/paused** pose. Add to the existing
  `logo-sprite.png` atlas (new column) rather than starting a third sheet, unless the new pose needs a
  meaningfully different canvas size.

## PixelLab prompt pattern

Adapted from agent-sprite-forge's containment + identity-lock rules, translated to our single-mascot,
non-combat use case (skip their directional/attack/projectile modes entirely, we don't need them):

1. **Lock identity first.** State the fixed traits every frame must keep: potato body shape, olive-sage
   armchair/couch, muted tan-gold potato skin, cream highlight, same camera distance and scale. Only the
   named pose element (arms, sparkles, eyes) may change between frames.
2. **Reference the accepted frame, don't re-describe it from scratch.** If `logo.png` is already accepted,
   view it first, then prompt "same character and palette as the image just shown, change only \<the pose>".
   Redescribing from zero is how sheets drift in palette/scale between frames.
3. **State the exact grid.** "Exactly N equal cells in a R×C grid" — same discipline as agent-sprite-forge's
   sheet-shape rule. For a 2-frame idle/cheer sheet that's `2x1`; don't ask for more frames than you'll wire.
4. **Containment, every time:** subject fully inside each cell, consistent margin on all sides, no part
   (arms, sparkles, cushion) crossing a cell edge, same silhouette scale across cells.
5. **Transparent background, not chroma-key.** PixelLab exports alpha directly — say "transparent background"
   not "solid magenta background" (that's the agent-sprite-forge convention for tools without native alpha
   export; we don't need the chroma-key cleanup step it implies).
6. **No text, no UI, no borders between cells** — same as their global rule, still applies to us.

## Delivery checklist (before accepting a generated sheet)

- **Verify real pixel dimensions** (`sips -g pixelWidth -g pixelHeight file.png` or PIL) — don't trust a
  round number you typed in the prompt. AI grid generation is rarely pixel-exact; measure, then write the
  atlas rects from the measurement, not the request.
- **Alpha is transparent, not black.** PixelLab sometimes lands a black knockout under alpha — check
  `hasAlpha: yes` isn't hiding an opaque black matte (see `Logo`/`LogoCelebrate` doc comments for the
  known gotcha). `apple-touch-icon.png`/`og.png` are the deliberate exception (opaque cream matte, because
  platforms paint transparent as black).
- **Same scale/anchor across frames** — lay both frames side by side and check the character doesn't grow,
  shrink, or shift vertically between poses; a swipeable idle/cheer loop reads as broken if the potato hops.
- **No edge-cropping** — nothing (arm, sparkle, cushion edge) touching or cut off at a cell boundary.
- **Update the atlas alongside the art.** Never ship a resized/re-cropped sheet without re-measuring
  `spriteAtlas.ts` + `logo-sprite.json` rects — a stale atlas silently mis-slices a live frame.

## Wiring

- Web: `image-rendering: pixelated` on every mascot `<img>`/CSS-sprite element (already the pattern in
  `Logo.web.tsx`/`LogoCelebrate.web.tsx`) so pixel art doesn't get browser-smoothed on scale.
  For a CSS-stepped sheet, drive `background-position`/`background-size` from the atlas cols/rows, not a
  hardcoded percentage — one source of truth for frame geometry.
- Cross-platform: RN native has no CSS sprite-stepping. Native fallback = show one static frame (usually
  `Logo`), don't try to port the CSS animation.
- Respect `prefers-reduced-motion`: any frame-cycling/bob/wiggle needs a `reduce` variant that either holds
  one frame or drops to a plain color/opacity change — same rule as all other motion in `.cursor/rules/ui.mdc`.

## Out of scope (don't pull from agent-sprite-forge)

Their directional walk sheets, combat/attack/projectile/impact modes, layered RPG maps, and Godot/Unity
engine-atlas assembly — none apply to a single mascot with no movement or combat. If Couch Potato ever needs
a second animated character or a tile/prop set, re-read their `references/modes.md` and `prompt-rules.md`
before reinventing grid conventions.
