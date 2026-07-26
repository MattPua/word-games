/**
 * PixelLab PNG masters → lossless WebP for web (pixel-identical via `exact`).
 *
 * Sharp's PNG re-encode mutates opaque pixels — do **not** use it to “optimize”
 * PNG masters. WebP `{ lossless: true, exact: true }` is byte-pixel-safe.
 *
 * Usage (repo root): `bun packages/ui/scripts/optimize-sprites.ts`
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
  await sharp(pngPath)
    .webp({ lossless: true, exact: true, effort: 6 })
    .toFile(webpPath);

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
      throw new Error(
        `${base}: pixel drift at byte ${i} (refuse to ship non-exact WebP)`,
      );
    }
  }

  await mkdir(dirname(publicWebp), { recursive: true });
  await copyFile(webpPath, publicWebp);

  if (REMOVE_PUBLIC_PNG.has(base)) {
    try {
      await unlink(publicPng);
    } catch {
      /* already gone */
    }
  }

  const saved = Math.round((1 - after / before) * 100);
  console.log(
    `${base}: ${kb(before)} PNG → ${kb(after)} WebP (−${saved}%)  ${info.width}×${info.height}`,
  );
}

for (const base of SHIP_WEBP) {
  await convertOne(base);
}

console.log("Done. Point atlas / Logo* src at .webp; keep PNG masters in packages/ui/src/assets.");
