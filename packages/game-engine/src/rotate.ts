import type { Board } from "./generate";
import type { GridTopology } from "./topology";

/**
 * One 90° CW rotate of the letter matrix — square and hex both use
 * `(r,c) → (c, n-1-r)`. Glyphs stay upright in UI; only cell positions move.
 * Topology param kept for call-site clarity / future lattice variants.
 */
export function rotateLettersCW(
  letters: string[][],
  _topology: GridTopology = "square",
): string[][] {
  const n = letters.length;
  return Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (_, c) => letters[n - 1 - c]![r]!),
  );
}

/** Apply `steps` quarter-turns CW (negative = CCW). Letters only — scores/words unchanged until regen. */
export function rotateBoard(board: Board, steps = 1): Board {
  const n = ((steps % 4) + 4) % 4;
  let letters = board.letters;
  for (let i = 0; i < n; i++) {
    letters = rotateLettersCW(letters, board.topology);
  }
  return { ...board, letters };
}
