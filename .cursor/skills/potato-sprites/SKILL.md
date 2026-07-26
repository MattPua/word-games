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

| File                                                                                         | Size                            | Use                                                                                                                                          |
| -------------------------------------------------------------------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/ui/src/assets/logo.png` (+ `.webp` ship)                                           | 256×256                         | Chill mark — web `Logo` → `/logo.webp`; PWA keeps `/logo.png`                                                                                |
| `packages/ui/src/assets/logo-mark.png` (+ `.webp`)                                           | 128×128                         | Optional face+sprout crop from chill `logo` — **not** used in chrome (site bar uses full `Logo`). Kept for experiments / future purpose-built marks. |
| `packages/ui/src/assets/logo-celebrate.png` (+ `.webp`)                                      | 256×256                         | Results celebrate flourish (optional; header uses `BrandMark`) + SVG sparkle overlay                                                          |
| `packages/ui/src/assets/logo-consolation.png` (+ `.webp`)                                    | 256×256                         | Results empty haul — `LogoConsolation` (sheepish shrug / better luck)                                                                        |
| `packages/ui/src/assets/logo-wave.png` (+ `.webp`)                                           | 256×256                         | About hello wave — `PotatoWaveSvg` (PixelLab one-off; cheer fallback until PNG lands)                                                        |
| `packages/ui/src/assets/logo-options.png` (+ `.webp`)                                        | 256×256                         | Gear-in-hand flourish — `LogoOptions` (not chrome header; header uses `BrandMark`)                                                          |
| `packages/ui/src/assets/logo-sprite.png` (+ `.webp`) + `logo-sprite.json` + `spriteAtlas.ts` | 1518×512, 3×1 cells 506×512     | **Master atlas only** (idle / cheer / bored). Not fetched at runtime.                                                                        |
| Cropped cells (from optimize)                                                                | ~160×160 logo / ~128×128 medals | `/logo-idle.webp`, `/logo-cheer.webp`, `/logo-snore.webp`, `/medals-*.webp` — nearest downscale from atlas cells (LCP-sized; not full 506px) |
| `packages/ui/src/assets/medals-sprite.png` (+ `.webp`) + json + atlas                        | 1608×420, 4×1 cells 402×420     | **Master only**. Runtime: `/medals-big-picture.webp`, `…-personal-bests`, `…-length-hauls`, `…-survival` via `MedalsCategorySprite`          |

All **runtime** web copies live in `apps/web/public/` as **`.webp` cell crops or standalone marks** — run `bun run sprites:optimize` after every PixelLab regen. Full sheets stay in `packages/ui/src/assets/` (crop source) and are **removed from `public/`**. Prefer WebP over PNG (`AGENTS.md` Image formats): sharp **lossless + exact**.
`spriteAtlas.ts` is the TS source of truth for master rects + `LOGO_FRAME_URLS` / `MEDALS_FRAME_URLS`; JSON mirrors stay in sync.

## SVG-mark direction (locked)

Web mascots are **`PotatoMark`**: raster PixelLab body + optional SVG motion layer. Same pattern as snore:

| Layer  | What                                                   | Why                                                      |
| ------ | ------------------------------------------------------ | -------------------------------------------------------- |
| Body   | Lossless WebP (`<img>`)                                | Pixel-identical to PixelLab; load only the pose you need |
| Motion | SVG overlays + CSS (Zzz, sparkles, gear, breath, poke) | Life without GIF/video or shipping full atlases          |
| Shell  | `PotatoMark.tsx`                                       | Shared size / pixelated / overlay stacking (web default). Non-hero → `loading="lazy"`; lobby chill `Logo` LCP → `fetchPriority="high"` eager |

**Do not** replace the body with ellipse/path “SVG potato” redraws — they drift from brand.

| Component                  | Body                            | SVG / motion                               |
| -------------------------- | ------------------------------- | ------------------------------------------ |
| `BrandMark`                | `/logo-mark.webp`               | Unused in chrome (crop experiment)         |
| `Logo`                     | `/logo.webp`                    | Lobby hero + `ChromeTopBar`                |
| `LogoCelebrate`            | `/logo-celebrate.webp`          | pixel sparkles                             |
| `LogoConsolation`          | `/logo-consolation.webp`        | — (empty haul shrug)                       |
| `LogoOptions`              | `/logo-options.webp`            | corner gear spin                           |
| `PotatoSnoreSvg`           | `/logo-snore.webp`              | breath + Zzz (EmptyState bored / flourishes — **not** lobby hero) |
| `PotatoGoSvg`              | `/logo-cheer.webp`              | bounce + play chevron (available flourish) |
| `PotatoWaveSvg`            | `/logo-wave.webp` (cheer until shipped) | soft rock + sparkles (About); purpose-built PixelLab wave — no SVG hand |
| `PotatoSprite` pinned      | `/logo-{idle,cheer,snore}.webp` | static                                     |
| `PotatoSprite` interactive | idle + cheer stacked            | bob + poke / periodic cheer                |
| `MedalsCategorySprite`     | `/medals-*.webp`                | Soft watermark in `/achievements` section cards (`.cp-medals-section-mascot`) |

Native fallbacks stay static `Logo` / `LogoCelebrate` (no CSS sprite-step / SVG overlay port).

## When to add a frame vs a new standalone mark

- **One-off pose, no animation** (chill, celebrate, options gear): standalone PNG like `logo.png` /
  `logo-celebrate.png` / `logo-options.png`, wired through `Logo*` + `PotatoMark` (+ SVG overlay if it needs life).
- **Two or more related poses** (idle / cheer / bored): keep one PixelLab **master sheet** for identity lock,
  but **ship cropped cells** to `public/` via `sprites:optimize` — runtime never `background-image`s the full atlas.
- **Lobby / how-to life:** lobby = chill `Logo` in hero `BrandHeader` (not bored snore); site bar on `/` is nav-only so the hero isn’t doubled. Chrome pages = `ChromeTopBar` (full `Logo` ~36 + wordmark | nav) + `PageHeading` — not a face crop, not centered BrandHeader reuse. How-to steps use top bar; done may use hero `BrandHeader`. **Never** GIF/video or soft-float bob on chrome marks.
- **`logo-mark` crop:** optional asset only — chrome does **not** ship a cropped face as the site mark. Prefer purpose-built PixelLab art if a compact mark is needed later.
- **Category sets** (medals): separate master sheet OK; crop to per-frame WebPs. Keep identity lock to `logo.png`.
- Likely next master columns: **loading/spin**, **couch-break**. After any `logo-sprite` regen, re-run `sprites:optimize` so all cell crops refresh.

## PixelLab prompt pattern

Adapted from agent-sprite-forge's containment + identity-lock rules, translated to our single-mascot,
non-combat use case (skip their directional/attack/projectile modes entirely, we don't need them):

1. **Lock identity first.** State the fixed traits every frame must keep: potato body shape, olive-sage
   armchair/couch, muted tan-gold potato skin, cream highlight, same camera distance and scale. Only the
   named pose element (arms, sparkles, eyes) may change between frames.
2. **Reference the accepted frame, don't re-describe it from scratch.** If `logo.png` is already accepted,
   view it first, then prompt "same character and palette as the image just shown, change only \<the pose>".
3. **State the exact grid.** "Exactly N equal cells in a R×C grid".
4. **Containment, every time:** subject fully inside each cell, consistent margin, no edge crossing, same scale.
5. **Transparent background, not chroma-key.**
6. **No text, no UI, no borders between cells.**

## Delivery checklist (before accepting a generated sheet)

- **Verify real pixel dimensions** — measure, then write atlas rects from the measurement.
- **Alpha is transparent, not black.** (`apple-touch-icon`/`og` = opaque cream exception.)
- **Same scale/anchor across frames.**
- **No edge-cropping.**
- **No light fringe / white halo on silhouette edges.**
- **Ship WebP crops to web.** `bun run sprites:optimize` writes asset WebPs, crops cells into `public/`,
  removes full sheets + large matching PNGs from `public/` (keeps `logo.png` for PWA). Point components at
  `LOGO_FRAME_URLS` / `MEDALS_FRAME_URLS` / `LOGO_MARK_URLS` — never `/logo-sprite.webp` at runtime.
- **Update the atlas alongside the art.** Stale rects mis-crop every cell.

## Wiring

- Web: `image-rendering: pixelated` via `.cp-potato-mark-body`. Motion classes in `theme.css` (`.cp-potato-*`).
- Cold routes (`/`, `/how-to`): no interactive poke (loads idle+cheer). Lobby chill `Logo` / how-to compact `BrandMark` only (no header snore / PotatoGo).
- Respect `prefers-reduced-motion` on breath / Zzz / sparkles / gear / bob.

## Out of scope (don't pull from agent-sprite-forge)

Their directional walk sheets, combat modes, layered RPG maps, and engine-atlas assembly — none apply here.
