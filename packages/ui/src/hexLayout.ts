/**
 * Shared hex board metrics (web LetterGrid + tests).
 * Engine adjacency stays odd-r; display is flat-top with each data-row as a
 * vertical column (90° from classic pointy-top horizontal rows) so the board
 * reads taller than wide.
 */

/** CSS clip-path for cream tiles — flat-top hex; select is the tile face when active. */
export const HEX_CLIP =
  "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";

/** Board aspect width / height units for an n×n flat-top vertical-column hex grid. */
export function hexAspect(n: number): { w: number; h: number } {
  return { w: 0.75 * (n - 1) + 1, h: n + 0.5 };
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
  // Data rows run vertically: row → x (0.75 pitch), col → y; odd rows shove down.
  return {
    x: (row * 0.75 + 0.5) * xPitch,
    y: (col + 0.5 + (row % 2 === 1 ? 0.5 : 0)) * yPitch,
  };
}

/** Absolute vertical-column box % for one data-row (same space as cellCenter). */
export function hexRowStyle(
  rowIndex: number,
  n: number,
): {
  top: string;
  left: string;
  width: string;
  height: string;
} {
  const { w, h } = hexAspect(n);
  return {
    left: `${((rowIndex * 0.75) / w) * 100}%`,
    top: rowIndex % 2 === 1 ? `${(0.5 / h) * 100}%` : "0",
    width: `${(1 / w) * 100}%`,
    height: `${(n / h) * 100}%`,
  };
}
