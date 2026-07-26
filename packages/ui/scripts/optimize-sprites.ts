/**
 * PixelLab PNG masters → lossless WebP for web (pixel-identical via `exact`).
 *
 * Sharp's PNG re-encode mutates opaque pixels — do **not** use it to “optimize”
 * PNG masters. WebP `{ lossless: true, exact: true }` is byte-pixel-safe.
 *
 * Usage (repo root): `bun packages/ui/scripts/optimize-sprites.ts`
 *
 * Sheets stay in `packages/ui/src/assets/` as crop sources; runtime fetches
 * cropped single-cell WebPs under `apps/web/public/` (SVG-mark bodies).
 */
import { copyFile, mkdir, stat, unlink } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../..");
const uiAssets = join(root, "packages/ui/src/assets");
const webPublic = join(root, "apps/web/public");

/** Basename without extension — PNG master must exist in `packages/ui/src/assets`. */
const SHIP_WEBP = [
  "logo-sprite",
  "medals-sprite",
  "logo",
  "logo-celebrate",
  "logo-options",
] as const;

/** Convert to assets WebP but do **not** ship the full sheet to `public/`. */
const ASSET_ONLY = new Set(["logo-sprite", "medals-sprite"]);

/**
 * Drop matching `.png` from `public/` after writing WebP.
 * Keep `logo.png` in public for PWA manifest / apple-ish hosts; platform
 * icons (`favicon`, `apple-touch-icon`, `og`) are never in SHIP_WEBP.
 */
const REMOVE_PUBLIC_PNG = new Set([
  "logo-sprite",
  "medals-sprite",
  "logo-celebrate",
  "logo-options",
]);

function kb(n: number) {
  return `${(n / 1024).toFixed(1)}K`;
}

async function convertOne(base: (typeof SHIP_WEBP)[number]) {
  const pngPath = join(uiAssets, `${base}.png`);
  const webpPath = join(uiAssets, `${base}.webp`);
  const publicWebp = join(webPublic, `${base}.webp`);
  const publicPng = join(webPublic, `${base}.png`);

  const before = (await stat(pngPath)).size;
  await sharp(pngPath).webp({ lossless: true, exact: true, effort: 6 }).toFile(webpPath);

  const after = (await stat(webpPath)).size;

  // Pixel-identity gate (opaque + transparent RGB kept via `exact`)
  const { data: a, info } = await sharp(pngPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { data: b } = await sharp(webpPath).ensureAlpha().raw().toBuffer({
    resolveWithObject: true,
  });
  if (a.length !== b.length) {
    throw new Error(`${base}: raw length mismatch after WebP`);
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      throw new Error(`${base}: pixel drift at byte ${i} (refuse to ship non-exact WebP)`);
    }
  }

  if (!ASSET_ONLY.has(base)) {
    await mkdir(dirname(publicWebp), { recursive: true });
    await copyFile(webpPath, publicWebp);
  } else {
    // Drop stale full-sheet copies from public if a prior run shipped them.
    try {
      await unlink(publicWebp);
      console.log(`${base}: removed full sheet from public/ (crops only)`);
    } catch {
      /* already gone */
    }
  }

  if (REMOVE_PUBLIC_PNG.has(base)) {
    try {
      await unlink(publicPng);
    } catch {
      /* already gone */
    }
  }

  const saved = Math.round((1 - after / before) * 100);
  console.log(
    `${base}: ${kb(before)} PNG → ${kb(after)} WebP (−${saved}%)  ${info.width}×${info.height}${ASSET_ONLY.has(base) ? " [asset only]" : ""}`,
  );
}

for (const base of SHIP_WEBP) {
  await convertOne(base);
}

async function cropCell(opts: {
  sheetWebp: string;
  rect: { x: number; y: number; w: number; h: number };
  outBase: string;
  label: string;
  /** Display-sized ship (nearest) — full cell is huge vs 64–96 CSS marks. */
  displayPx: number;
}) {
  const outUi = join(uiAssets, `${opts.outBase}.webp`);
  const outPublic = join(webPublic, `${opts.outBase}.webp`);
  await sharp(opts.sheetWebp)
    .extract({
      left: opts.rect.x,
      top: opts.rect.y,
      width: opts.rect.w,
      height: opts.rect.h,
    })
    .resize(opts.displayPx, opts.displayPx, {
      kernel: sharp.kernel.nearest,
      fit: "fill",
    })
    .webp({ lossless: true, exact: true, effort: 6 })
    .toFile(outUi);
  await mkdir(dirname(outPublic), { recursive: true });
  await copyFile(outUi, outPublic);
  const n = (await stat(outPublic)).size;
  console.log(
    `${opts.label}: ${opts.rect.w}×${opts.rect.h} → ${opts.displayPx}px → ${kb(n)} WebP (/${opts.outBase}.webp)`,
  );
}

/** Single-cell WebPs for SVG-mark bodies (no runtime full-sheet fetch). */
async function cropFrameCells() {
  const { LOGO_SPRITE_FRAMES, MEDALS_SPRITE_FRAMES } = await import("../src/spriteAtlas.ts");

  const logoSheet = join(uiAssets, "logo-sprite.webp");
  // ~72–96 CSS @2x → 160px is enough; smaller LCP than 192.
  const LOGO_DISPLAY_PX = 160;
  const MEDALS_DISPLAY_PX = 128;
  await cropCell({
    sheetWebp: logoSheet,
    rect: LOGO_SPRITE_FRAMES.idle,
    outBase: "logo-idle",
    label: "logo-idle",
    displayPx: LOGO_DISPLAY_PX,
  });
  await cropCell({
    sheetWebp: logoSheet,
    rect: LOGO_SPRITE_FRAMES.cheer,
    outBase: "logo-cheer",
    label: "logo-cheer",
    displayPx: LOGO_DISPLAY_PX,
  });
  await cropCell({
    sheetWebp: logoSheet,
    rect: LOGO_SPRITE_FRAMES.bored,
    outBase: "logo-snore",
    label: "logo-snore (bored)",
    displayPx: LOGO_DISPLAY_PX,
  });

  const medalsSheet = join(uiAssets, "medals-sprite.webp");
  const medalCrops: Array<{
    frame: keyof typeof MEDALS_SPRITE_FRAMES;
    outBase: string;
  }> = [
    { frame: "bigPicture", outBase: "medals-big-picture" },
    { frame: "personalBests", outBase: "medals-personal-bests" },
    { frame: "lengthHauls", outBase: "medals-length-hauls" },
    { frame: "survival", outBase: "medals-survival" },
  ];
  for (const { frame, outBase } of medalCrops) {
    await cropCell({
      sheetWebp: medalsSheet,
      rect: MEDALS_SPRITE_FRAMES[frame],
      outBase,
      label: outBase,
      displayPx: MEDALS_DISPLAY_PX,
    });
  }
}

await cropFrameCells();

console.log(
  "Done. Runtime marks use cropped /logo-*.webp + /medals-*.webp; sheet masters stay in assets/.",
);
