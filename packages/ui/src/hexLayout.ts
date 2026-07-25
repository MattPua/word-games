/** Shared odd-r pointy-top hex board metrics (web LetterGrid + tests). */

/** CSS clip-path for cream tiles — select is the tile face itself when active. */
export const HEX_CLIP = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

/** Board aspect width / height units for an n×n odd-r hex grid. */
export function hexAspect(n: number): { w: number; h: number } {
  return { w: n + 0.5, h: 0.75 * (n - 1) + 1 };
}

/** Cell center in 0–100 play-surface coords (path stroke). Margins are symmetric so centers stay put when `--cp-tile-gap` grows. */
export function cellCenter(
  row: number,
  col: number,
  n: number,
  topology: "square" | "hex",
): { x: number; y: number } {
  if (topology !== "hex") {
    return {
      x: ((col + 0.5) / n) * 100,
      y: ((row + 0.5) / n) * 100,
    };
  }
  const { w, h } = hexAspect(n);
  const xPitch = 100 / w;
  const yPitch = 100 / h;
  return {
    x: (col + 0.5 + (row % 2 === 1 ? 0.5 : 0)) * xPitch,
    y: (row * 0.75 + 0.5) * yPitch,
  };
}

/** Absolute row box % for odd-r hex (same space as cellCenter). */
export function hexRowStyle(rowIndex: number, n: number): {
  top: string;
  left: string;
  width: string;
  height: string;
} {
  const { w, h } = hexAspect(n);
  return {
    top: `${((rowIndex * 0.75) / h) * 100}%`,
    left: rowIndex % 2 === 1 ? `${(0.5 / w) * 100}%` : "0",
    width: `${(n / w) * 100}%`,
    height: `${(1 / h) * 100}%`,
  };
}
